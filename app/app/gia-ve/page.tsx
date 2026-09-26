import type {Metadata} from 'next';
import {PageBanner,RouteMotion,Tickets, TicketPolicy} from '../_components/SiteParts';
export const metadata:Metadata={title:'Giá vé',description:'Vé người lớn 120.000đ, vé trẻ em 80.000đ. Loại vé được xác định theo chiều cao thực tế.'};
export default function Page(){return <RouteMotion><PageBanner eyebrow="THÔNG TIN VÉ" title="Giá vé tham quan" accent="Chuồn Chuồn." image="/images/chuon-chuon/toan-canh-vuon-hoa.jpg" alt="Toàn cảnh vườn hoa Chuồn Chuồn" intro="Vé người lớn 120.000đ, vé trẻ em 80.000đ. Loại vé được xác định theo chiều cao thực tế."/><Tickets/><TicketPolicy/></RouteMotion>;}
