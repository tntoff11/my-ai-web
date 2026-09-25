import type { Metadata } from 'next';
import { Experiences, Gallery, PageBanner, RouteMotion } from '../_components/SiteParts';
export const metadata: Metadata = { title: 'Trải nghiệm' };
export default function ExperiencesPage() {
  return <RouteMotion><PageBanner eyebrow="KHÁM PHÁ CHUỒN CHUỒN" title="Chơi theo" accent="nhịp của bạn." image="/images/chuon-chuon/cau-vuon-hoa-tren-cao.jpg" alt="Lối đi giữa vườn hoa nhìn từ trên cao" intro="Vườn hoa, khu thú mini, hồ nước và những trò chơi ngoài trời. Mỗi điểm dừng mở ra một góc nhìn khác." /><Experiences /><Gallery /></RouteMotion>;
}
