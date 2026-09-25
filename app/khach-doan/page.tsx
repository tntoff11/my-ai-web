import type {Metadata} from 'next';
import {PageBanner,RouteMotion,Groups} from '../_components/SiteParts';
export const metadata:Metadata={title:'Khách đoàn',description:'Chuồn Chuồn tiếp nhận nhu cầu từ trường học, doanh nghiệp, nhóm du lịch và đối tác. Liên hệ trước để trao đổi về số lượng khách, hoạt động và ăn uống.'};
export default function Page(){return <RouteMotion><PageBanner eyebrow="TRƯỜNG HỌC · DOANH NGHIỆP · NHÓM DU LỊCH" title="Thông tin dành cho" accent="khách đoàn." image="/images/chuon-chuon/gia-dinh-vuon-thu.jpg" alt="Gia đình tham quan vườn thú mini" intro="Chuồn Chuồn tiếp nhận nhu cầu từ trường học, doanh nghiệp, nhóm du lịch và đối tác. Liên hệ trước để trao đổi về số lượng khách, hoạt động và ăn uống."/><Groups/></RouteMotion>;}
