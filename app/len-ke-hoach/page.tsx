import type {Metadata} from 'next';
import {PageBanner,RouteMotion,Plan, TravelNotes} from '../_components/SiteParts';
export const metadata:Metadata={title:'Lên kế hoạch',description:'Kiểm tra giờ mở cửa, điều kiện tham gia trò chơi, địa hình di chuyển và lưu ý về thời tiết.'};
export default function Page(){return <RouteMotion><PageBanner eyebrow="THÔNG TIN CHUYẾN ĐI" title="Chuẩn bị cho" accent="chuyến tham quan." image="/images/chuon-chuon/gia-dinh-vuon-hoa.jpg" alt="Gia đình tham quan vườn hoa" intro="Kiểm tra giờ mở cửa, điều kiện tham gia trò chơi, địa hình di chuyển và lưu ý về thời tiết."/><Plan/><TravelNotes/></RouteMotion>;}
