import type { Metadata } from 'next';
import { PageBanner, RouteMotion, TicketPolicy, Tickets } from '../_components/SiteParts';
export const metadata: Metadata = { title: 'Giá vé' };
export default function TicketsPage() {
  return <RouteMotion><PageBanner eyebrow="THÔNG TIN VÉ" title="Một tấm vé." accent="Rất nhiều niềm vui." image="/images/chuon-chuon/toan-canh-vuon-hoa.jpg" alt="Toàn cảnh vườn hoa tím tại Chuồn Chuồn" intro="Xem giá, cách tính vé theo chiều cao và những trải nghiệm đã bao gồm trước khi lên đường." /><Tickets /><TicketPolicy /></RouteMotion>;
}
