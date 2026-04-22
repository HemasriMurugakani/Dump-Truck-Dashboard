"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { getMineSites } from "@/lib/mockData";
import { routeForRole } from "@/lib/routes";
import { motion } from "framer-motion";
import { getSession, signIn } from "next-auth/react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { toast } from "sonner";

export function LoginView() {
  const router = useRouter();
  const [email, setEmail] = useState("site.manager@smartbed.ai");
  const [password, setPassword] = useState("Password123!");
  const [siteId, setSiteId] = useState("alpha");
  const [remember, setRemember] = useState(true);
  const [loading, setLoading] = useState(false);
  const [sites, setSites] = useState<Array<{ id: string; name: string }>>([]);
  const [stats, setStats] = useState({ trucks: 0, accuracy: 0, carryback: 0 });

  useEffect(() => {
    getMineSites().then((rows) => setSites(rows.map((r) => ({ id: r.id, name: r.name }))));
  }, []);

  useEffect(() => {
    const id = window.setInterval(() => {
      setStats((prev) => ({
        trucks: Math.min(8, prev.trucks + 1),
        accuracy: Math.min(98.9, +(prev.accuracy + 3.3).toFixed(1)),
        carryback: Math.min(0.4, +(prev.carryback + 0.04).toFixed(2)),
      }));
    }, 80);
    return () => window.clearInterval(id);
  }, []);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    const result = await signIn("credentials", {
      email,
      password,
      siteId,
      rememberDevice: String(remember),
      redirect: false,
    });

    if (!result || result.error) {
      toast.error("Invalid credentials for selected site.");
      setLoading(false);
      return;
    }

    const session = await getSession();
    if (session?.user) {
      router.push(routeForRole(session.user.role, session.user.assignedTruckId));
      return;
    }

    router.push("/dashboard");
  }

  return (
    <div className="login-root min-h-screen bg-[#0A0A0A] text-[#F5F5F5] grid lg:grid-cols-2">
      <div className="relative p-8 lg:p-14 border-b lg:border-b-0 lg:border-r border-[#1F1F1F]">
        <div className="absolute inset-0 pointer-events-none opacity-20 bg-[linear-gradient(rgba(255,255,255,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.03)_1px,transparent_1px)] bg-[size:24px_24px] animate-[gridMove_18s_linear_infinite]" />
        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-10">
            <div className="h-8 w-8 rounded-md bg-[#FFC107]" />
            <div>
              <div className="text-2xl font-semibold">SmartBed</div>
              <div className="text-xs text-[#9CA3AF] tracking-[0.25em] uppercase">Detection System</div>
            </div>
          </div>

          <div className="space-y-4 max-w-md">
            <Stat label="Active Trucks" value={`${stats.trucks}`} suffix="" tail="8" />
            <Stat label="Detection Accuracy" value={`${stats.accuracy.toFixed(1)}`} suffix="%" />
            <Stat label="Avg Carry-Back Rate" value={`${stats.carryback.toFixed(2)}`} suffix="%" />
          </div>
        </div>
      </div>

      <div className="p-8 lg:p-14 flex items-center justify-center">
        <div className="w-full max-w-md">
          <Card>
            <CardHeader>
              <h1 className="text-xl font-semibold">SCBES Secure Access</h1>
              <p className="text-sm text-[#9CA3AF]">Sign in to Smart Carry-Back Detection and Elimination System</p>
            </CardHeader>
            <CardContent>
              <form onSubmit={onSubmit} className="space-y-4">
                <Input
                  type="email"
                  placeholder="Email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={loading}
                />
                <Input
                  type="password"
                  placeholder="Password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={loading}
                />
                <Select value={siteId} onValueChange={setSiteId} disabled={loading}>
                  <SelectTrigger>
                    <SelectValue placeholder="Mine Site" />
                  </SelectTrigger>
                  <SelectContent>
                    {sites.map((site) => (
                      <SelectItem key={site.id} value={site.id}>
                        {site.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <div className="flex items-center justify-between text-sm">
                  <label className="flex items-center gap-2 text-[#9CA3AF]">
                    <Switch checked={remember} onCheckedChange={setRemember} disabled={loading} />
                    Remember this device
                  </label>
                  <Link href="#" className="text-[#9CA3AF] hover:text-[#F5F5F5]">Forgot password?</Link>
                </div>

                <Button className="w-full h-10" type="submit" disabled={loading}>
                  {loading ? <span className="h-4 w-4 rounded-full border-2 border-black border-t-transparent animate-spin" /> : "Login"}
                </Button>
              </form>
            </CardContent>
          </Card>

          <div className="mt-4 inline-flex items-center gap-2 rounded-full border border-[#1F1F1F] bg-[#111111] px-3 py-1 text-xs font-mono text-[#22C55E]">
            <span className="h-2 w-2 rounded-full bg-[#22C55E]" />
            v4.2.1 LIVE
          </div>
        </div>
      </div>
    </div>
  );
}

function Stat({ label, value, suffix, tail }: { label: string; value: string; suffix: string; tail?: string }) {
  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="rounded-lg border border-[#1F1F1F] bg-[#111111] p-4">
      <div className="text-xs text-[#9CA3AF] uppercase tracking-wider">{label}</div>
      <div className="mt-1 text-2xl font-semibold tabular-nums">
        {value}
        {suffix}
        {tail ? `/${tail}` : ""}
      </div>
    </motion.div>
  );
}
