import type {Metadata} from 'next';
import {PageBanner,RouteMotion,Visit} from '../_components/SiteParts';
export const metadata:Metadata={title:'Đường đi',description:'Xem địa chỉ, vị trí trên Google Maps và thông tin di chuyển trước khi xuất phát.'};
export default function Page(){return <RouteMotion><PageBanner eyebrow="NAM BAN · LÂM ĐỒNG" title="Đường đến Điểm Du Lịch" accent="Chuồn Chuồn." image="/images/chuon-chuon/cau-check-in.jpg" alt="Khu tham quan trên đồi tại Chuồn Chuồn" intro="Xem địa chỉ, vị trí trên Google Maps và thông tin di chuyển trước khi xuất phát."/><Visit/></RouteMotion>;}
