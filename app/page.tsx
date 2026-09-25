import { Hero, HomeRoutes, Intro, Momentum, RouteMotion } from './_components/SiteParts';

export default function HomePage() {
  return <RouteMotion><Hero /><Intro /><HomeRoutes /><Momentum /></RouteMotion>;
}
