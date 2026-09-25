import type { Metadata } from 'next';
import { PageBanner, Plan, RouteMotion, TravelNotes } from '../_components/SiteParts';
export const metadata: Metadata = { title: 'Lên kế hoạch' };
export default function PlanPage() {
  return <RouteMotion><PageBanner eyebrow="CHUẨN BỊ CHUYẾN ĐI" title="Ngày vui" accent="bắt đầu từ đây." image="/images/chuon-chuon/gia-dinh-vuon-hoa.jpg" alt="Gia đình dạo giữa vườn hoa" intro="Giờ mở cửa, trò chơi, thời tiết và những điều cần chuẩn bị cho hành trình giữa thiên nhiên." /><Plan /><TravelNotes /></RouteMotion>;
}
