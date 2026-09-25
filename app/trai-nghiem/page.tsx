import type {Metadata} from 'next';
import {PageBanner,RouteMotion,Experiences, Gallery} from '../_components/SiteParts';
export const metadata:Metadata={title:'Trải nghiệm',description:'Tìm hiểu các khu tham quan, hoạt động vui chơi và những điểm check-in trong khu du lịch.'};
export default function Page(){return <RouteMotion><PageBanner eyebrow="KHÁM PHÁ CHUỒN CHUỒN" title="Có gì để trải nghiệm" accent="tại Chuồn Chuồn?" image="/images/chuon-chuon/cau-vuon-hoa-tren-cao.jpg" alt="Lối tham quan giữa những tán hoa tím" intro="Tìm hiểu các khu tham quan, hoạt động vui chơi và những điểm check-in trong khu du lịch."/><Experiences/><Gallery/></RouteMotion>;}
