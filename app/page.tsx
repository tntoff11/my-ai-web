import ScrollJourney from './_components/ScrollJourney';
import { HomeRoutes, Intro, Momentum, RouteMotion } from './_components/SiteParts';

export default function HomePage() {
  return <RouteMotion><ScrollJourney /><div className="home-after-ride"><Intro /><HomeRoutes /><Momentum /></div></RouteMotion>;
}
