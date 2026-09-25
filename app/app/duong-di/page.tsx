import type { Metadata } from 'next';
import { PageBanner, RouteMotion, Visit } from '../_components/SiteParts';
export const metadata: Metadata = { title: 'Đường đi' };
export default function DirectionsPage() {
  return <RouteMotion><PageBanner eyebrow="HẸN GẶP TẠI NAM BAN" title="Theo dấu" accent="Chuồn Chuồn." image="/images/chuon-chuon/cau-check-in.jpg" alt="Cầu tham quan giữa cảnh đồi xanh" intro="Địa chỉ chính thức, Google Maps, thời gian di chuyển tham khảo và chỗ đỗ xe miễn phí." /><Visit /></RouteMotion>;
}
