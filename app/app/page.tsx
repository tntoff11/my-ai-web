import ScrollJourney from './_components/ScrollJourney';
import { Hero, HomeRoutes, Intro, Momentum, RouteMotion } from './_components/SiteParts';

export default function HomePage() {
  return <RouteMotion><Hero /><ScrollJourney /><Intro /><HomeRoutes /><Momentum /></RouteMotion>;
}
