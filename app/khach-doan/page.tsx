import type { Metadata } from 'next';
import { Groups, PageBanner, RouteMotion } from '../_components/SiteParts';
export const metadata: Metadata = { title: 'Khách đoàn' };
export default function GroupsPage() {
  return <RouteMotion><PageBanner eyebrow="05 / HÀNH TRÌNH CÙNG NHAU" title="Đi cùng nhau." accent="Vui nhiều hơn." image="/images/chuon-chuon/gia-dinh-vuon-thu.jpg" alt="Gia đình trải nghiệm khu thú mini" intro="Dành cho đoàn, trường học, doanh nghiệp và những chuyến đi cần chuẩn bị trước." /><Groups /></RouteMotion>;
}
