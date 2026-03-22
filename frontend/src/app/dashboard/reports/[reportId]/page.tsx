'use client';
import dynamic from 'next/dynamic';

const ReportDetail = dynamic(
    () => import('./ReportDetailContent').then((mod) => mod.ReportDetailContent),
    { ssr: false }
);

export default function ReportDetailPage() {
    return <ReportDetail />;
}
