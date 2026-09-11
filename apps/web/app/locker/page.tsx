import type { Metadata } from "next";
import { LockerPage } from "@/components/LockerPage";

export const metadata: Metadata = { title: "Yonder locker - Cash out", description: "Redeem settled DreamDEX Event Contract positions." };

export default function Page() { return <LockerPage />; }
