import AnalyticsDashboard from '@/components/admin/analytics/AnalyticsDashboard';

export const metadata = {
  title: 'تحلیل و آمار | پنل مدیریت',
};

export default function AnalyticsPage() {
  return (
    <div className="max-w-[1600px] mx-auto">
      <AnalyticsDashboard />
    </div>
  );
}
