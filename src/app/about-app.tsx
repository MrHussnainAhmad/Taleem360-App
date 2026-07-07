import { InfoPageScreen } from '@/components/InfoPageScreen';
import { infoPages } from '@/constants/info-pages';

export default function AboutAppScreen() {
  return <InfoPageScreen page={infoPages.aboutApp} />;
}
