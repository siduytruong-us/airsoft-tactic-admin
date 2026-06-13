"use client";

import { AdminLayout } from "@/components/layout/AdminLayout";
import { useStats } from "@/hooks/api/useStats";
import { Users, MapPin, Swords, Trophy } from "lucide-react";

interface StatCardProps {
  title: string;
  value?: number;
  icon: React.ElementType;
  color: string;
  isLoading: boolean;
}

function StatCard({ title, value, icon: Icon, color, isLoading }: StatCardProps) {
  return (
    <div className="rounded-xl border bg-white p-6 shadow-sm">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-500">{title}</p>
          {isLoading ? (
            <div className="mt-2 h-8 w-24 animate-pulse rounded bg-gray-200" />
          ) : (
            <p className="mt-1 text-3xl font-bold text-gray-900">
              {value?.toLocaleString("vi-VN") ?? "—"}
            </p>
          )}
        </div>
        <div className={`rounded-xl p-3 ${color}`}>
          <Icon className="h-6 w-6 text-white" />
        </div>
      </div>
    </div>
  );
}

export default function DashboardPage() {
  const { data: stats, isLoading } = useStats();

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-sm text-gray-500">Tổng quan hệ thống Airsoft Tactic</p>
        </div>

        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 xl:grid-cols-4">
          <StatCard
            title="Tổng người dùng"
            value={stats?.totalUsers}
            icon={Users}
            color="bg-blue-500"
            isLoading={isLoading}
          />
          <StatCard
            title="Tổng sân chơi"
            value={stats?.totalFields}
            icon={MapPin}
            color="bg-green-500"
            isLoading={isLoading}
          />
          <StatCard
            title="Trận đang diễn ra"
            value={stats?.activeMatches}
            icon={Swords}
            color="bg-orange-500"
            isLoading={isLoading}
          />
          <StatCard
            title="Tổng trận đã chơi"
            value={stats?.totalMatchesPlayed}
            icon={Trophy}
            color="bg-purple-500"
            isLoading={isLoading}
          />
        </div>

        {/* Placeholder charts */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <div className="rounded-xl border bg-white p-6 shadow-sm">
            <h2 className="mb-4 font-semibold text-gray-900">Hoạt động gần đây</h2>
            <p className="text-sm text-gray-400">Biểu đồ sẽ được tích hợp sau...</p>
          </div>
          <div className="rounded-xl border bg-white p-6 shadow-sm">
            <h2 className="mb-4 font-semibold text-gray-900">Thống kê theo tháng</h2>
            <p className="text-sm text-gray-400">Biểu đồ sẽ được tích hợp sau...</p>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
