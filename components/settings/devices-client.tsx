"use client";

import { useState } from "react";
import { Monitor, Smartphone, Globe, ShieldAlert, LogOut, Clock, MapPin } from "lucide-react";
import { revokeDevice, revokeAllOtherDevices } from "@/app/actions/devices";
import { useRouter } from "next/navigation";

export function DevicesClient({ initialDevices }: { initialDevices: any[] }) {
  const [devices, setDevices] = useState(initialDevices);
  const [isProcessing, setIsProcessing] = useState<string | null>(null);
  const [isRevokingAll, setIsRevokingAll] = useState(false);
  const router = useRouter();

  const handleRevoke = async (deviceId: string) => {
    if (!confirm("Are you sure you want to log out of this device?")) return;
    
    setIsProcessing(deviceId);
    try {
      const res = await revokeDevice(deviceId);
      if (res.success) {
        setDevices(prev => prev.filter(d => d.id !== deviceId));
      } else {
        alert(res.error || "Failed to revoke device");
      }
    } catch (err) {
      alert("An error occurred");
    } finally {
      setIsProcessing(null);
    }
  };

  const handleRevokeAll = async () => {
    if (!confirm("Are you sure you want to log out of ALL other devices? You will remain logged in on this device only.")) return;
    
    setIsRevokingAll(true);
    try {
      const res = await revokeAllOtherDevices();
      if (res.success) {
        setDevices(prev => prev.filter(d => d.isCurrentDevice));
        alert("All other sessions have been successfully logged out.");
      } else {
        alert(res.error || "Failed to revoke devices");
      }
    } catch (err) {
      alert("An error occurred");
    } finally {
      setIsRevokingAll(false);
    }
  };

  const currentDevice = devices.find(d => d.isCurrentDevice);
  const otherDevices = devices.filter(d => !d.isCurrentDevice);

  return (
    <div className="space-y-8">
      {/* Current Device */}
      <section>
        <h3 className="text-xl font-bold text-heading mb-4">Current Session</h3>
        {currentDevice ? (
          <div className="p-6 bg-primary/5 border border-primary/20 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                {currentDevice.deviceType === "mobile" ? <Smartphone className="w-6 h-6 text-primary" /> : <Monitor className="w-6 h-6 text-primary" />}
              </div>
              <div>
                <h4 className="font-bold text-heading text-lg">{currentDevice.browser} on {currentDevice.os}</h4>
                <div className="flex flex-wrap items-center gap-2 sm:gap-4 text-sm text-muted mt-1">
                  <span className="flex items-center gap-1"><MapPin className="w-4 h-4" /> {currentDevice.ip}</span>
                  <span className="flex items-center gap-1"><Globe className="w-4 h-4" /> {currentDevice.deviceType}</span>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2 px-3 py-1 bg-primary text-primary-foreground text-xs font-bold rounded-full">
              <ShieldAlert className="w-4 h-4" />
              Active Now
            </div>
          </div>
        ) : (
          <div className="p-6 bg-surface border border-border rounded-xl text-center text-muted">
            Current session not tracked. (Please log out and log back in to begin tracking).
          </div>
        )}
      </section>

      <div className="h-px bg-border" />

      {/* Other Devices */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xl font-bold text-heading">Other Active Sessions</h3>
          {otherDevices.length > 0 && (
            <button 
              onClick={handleRevokeAll}
              disabled={isRevokingAll}
              className="px-4 py-2 bg-error/10 hover:bg-error/20 text-error text-sm font-bold rounded-md transition-colors disabled:opacity-50"
            >
              {isRevokingAll ? "Processing..." : "Sign Out All Other Sessions"}
            </button>
          )}
        </div>

        {otherDevices.length > 0 ? (
          <div className="space-y-4">
            {otherDevices.map(device => (
              <div key={device.id} className="p-4 bg-background border border-border hover:border-border-hover rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition-colors">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-full bg-surface-secondary flex items-center justify-center shrink-0">
                    {device.deviceType === "mobile" ? <Smartphone className="w-5 h-5 text-muted" /> : <Monitor className="w-5 h-5 text-muted" />}
                  </div>
                  <div>
                    <h4 className="font-bold text-heading">{device.browser} on {device.os}</h4>
                    <div className="flex flex-wrap items-center gap-2 sm:gap-4 text-xs text-muted mt-1">
                      <span className="flex items-center gap-1"><MapPin className="w-3.5 h-3.5" /> {device.ip}</span>
                      <span className="flex items-center gap-1"><Clock className="w-3.5 h-3.5" /> Last active {new Date(device.lastActive).toLocaleDateString()}</span>
                    </div>
                  </div>
                </div>
                <button 
                  onClick={() => handleRevoke(device.id)}
                  disabled={isProcessing === device.id || isRevokingAll}
                  className="px-4 py-2 border border-border hover:bg-surface text-heading text-sm font-semibold rounded-md transition-colors disabled:opacity-50"
                >
                  {isProcessing === device.id ? "Signing Out..." : "Sign Out"}
                </button>
              </div>
            ))}
          </div>
        ) : (
          <div className="p-8 bg-surface-secondary border border-border rounded-xl text-center">
            <ShieldAlert className="w-8 h-8 text-muted mx-auto mb-3" />
            <p className="text-heading font-medium">No other active sessions found.</p>
            <p className="text-sm text-muted mt-1">You're only signed in on this device.</p>
          </div>
        )}
      </section>
    </div>
  );
}
