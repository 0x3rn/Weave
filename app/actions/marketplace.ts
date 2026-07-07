"use server";

import { db as adminDb } from "@/lib/firebase-admin";
import { db as webDb } from "@/lib/firebase";
import { MarketplaceRequest, MarketplaceFilters, MarketplaceApplication } from "@/types";
import { documentMatches, score, field, and, or } from "firebase/firestore/pipelines";
import { execute } from "firebase/firestore/pipelines";
import { calculateTrustScore } from "@/lib/user-metrics"; // if execution requires it, wait, the guide just chains it. Actually, `pipeline.d.ts` shows `await execute(db.pipeline()...)`

export async function getMarketplaceData(filters: Partial<MarketplaceFilters> = {}, searchQuery: string = "") {
  if (!adminDb) {
    return { success: false, error: "Database not initialized" };
  }
  
  try {
    let requests: MarketplaceRequest[] = [];
    
    // Using Industry Standard Firestore Pipelines for advanced search and filtering
    if (searchQuery) {
      // Execute pipeline with native full-text search
      let pipeline = webDb.pipeline().collection("marketplace_requests")
        .search({
          query: documentMatches(searchQuery),
          sort: score().descending()
        })
      const snapshot = await execute(pipeline);
      snapshot.results.forEach((doc: any) => {
        requests.push({ id: doc.id, ...doc.data() } as MarketplaceRequest);
      });
    } else {
      // Standard query
      const requestsSnapshot = await adminDb.collection("marketplace_requests")
        .orderBy("createdAt", "desc")
        .limit(100)
        .get();
        
      requestsSnapshot.forEach((doc: any) => {
        requests.push({ id: doc.id, ...doc.data() } as MarketplaceRequest);
      });
    }
    
    // Dynamically fetch live user profiles for all requests so avatars, names, and scores are up to date
    const uniqueRequesterIds = [...new Set(requests.map(r => r.requesterId))];
    const usersMap = new Map();
    
    // Firestore 'in' queries support max 30 items. Chunking if necessary.
    for (let i = 0; i < uniqueRequesterIds.length; i += 30) {
      const chunk = uniqueRequesterIds.slice(i, i + 30);
      if (chunk.length > 0) {
        const requesterDocs = await adminDb.collection("users").where("__name__", "in", chunk).get();
        requesterDocs.forEach((doc: any) => {
          usersMap.set(doc.id, doc.data());
        });
      }
    }
    
    requests = requests.map(r => {
      const uData = usersMap.get(r.requesterId);
      if (uData) {
        return {
          ...r,
          requesterName: uData.fullName || uData.displayName || uData.username || r.requesterName,
          requesterAvatar: uData.photoURL || uData.photoUrl || r.requesterAvatar || null,
          requesterTrustScore: uData.trustScore !== undefined ? uData.trustScore : calculateTrustScore(uData as any),
          requesterVerification: uData.isVerified || false
        };
      }
      return r;
    });
    
    // Apply in-memory filters to avoid requiring complex composite indexes
    if (filters.category && filters.category.length > 0) {
      requests = requests.filter(r => filters.category!.includes(r.category));
    }
    
    if (filters.verifiedOnly) {
      requests = requests.filter(r => r.requesterVerification === true);
    }
    
    if (filters.minTrustScore) {
      requests = requests.filter(r => r.requesterTrustScore >= filters.minTrustScore!);
    }
    
    const usersSnapshot = await adminDb.collection("users").limit(100).get();
      
    let professionals: any[] = [];
    usersSnapshot.forEach((doc: any) => {
      const data = doc.data();
      const trustScore = data.trustScore !== undefined ? data.trustScore : calculateTrustScore(data as any);
      
      professionals.push({
        id: doc.id,
        name: data.fullName || data.displayName || data.username || "Unknown",
        username: data.username || doc.id,
        avatar: data.photoURL || data.photoUrl || null,
        headline: data.headline || data.profession || "",
        isVerified: data.isVerified || false,
        trustScore,
        rating: data.stats?.rating || 0,
        completedExchanges: data.stats?.exchangesCompleted || 0,
        topSkills: (data.skillsOffered || []).map((s: any) => typeof s === 'string' ? s : s.name).slice(0, 3),
        availability: data.availability || "Not specified",
      });
    });
    
    if (filters.minTrustScore) {
      professionals = professionals.filter(p => p.trustScore >= filters.minTrustScore!);
    }
    
    if (filters.minRating && filters.minRating !== "Any" && filters.minRating !== "") {
      const minR = parseFloat(filters.minRating);
      professionals = professionals.filter(p => p.rating >= minR);
    }
    
    // Optional: Filter professionals by category/skills loosely
    if (filters.category && filters.category.length > 0) {
       // If a professional has skills that match the category names loosely, or we just rely on skills.
       // For this demo, we'll just return all professionals if no specific skill filter is provided, 
       // but strictly speaking we could filter by topSkills.
    }
    
    return {
      success: true,
      requests,
      professionals,
      stats: {
        openRequests: requests.length,
        professionalsAvailable: professionals.length,
        newToday: requests.filter(r => new Date(r.createdAt).getTime() > Date.now() - 86400000).length,
        recommendedMatches: Math.min(12, requests.length)
      }
    };
  } catch (error: any) {
    console.error("Error fetching marketplace data:", error);
    return { success: false, error: error.message };
  }
}

export async function getMarketplaceRequest(id: string) {
  if (!adminDb) {
    return { success: false, error: "Database not initialized" };
  }
  
  try {
    const docSnap = await adminDb.collection("marketplace_requests").doc(id).get();
    
    if (!docSnap.exists) {
      return { success: false, error: "Request not found" };
    }
    
    const requestData = { id: docSnap.id, ...docSnap.data() } as MarketplaceRequest;
    
    // Dynamically fetch requester data
    const userDoc = await adminDb.collection("users").doc(requestData.requesterId).get();
    if (userDoc.exists) {
      const uData = userDoc.data()!;
      requestData.requesterName = uData.fullName || uData.displayName || uData.username || requestData.requesterName;
      requestData.requesterAvatar = uData.photoURL || uData.photoUrl || requestData.requesterAvatar || null;
      requestData.requesterTrustScore = uData.trustScore !== undefined ? uData.trustScore : calculateTrustScore(uData as any);
      requestData.requesterVerification = uData.isVerified || false;
    }
    
    return {
      success: true,
      request: requestData
    };
  } catch (error: any) {
    console.error("Error fetching marketplace request:", error);
    return { success: false, error: error.message };
  }
}
