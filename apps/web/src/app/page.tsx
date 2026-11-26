import { LanguageProvider } from '@/components/language-context';
import { PortfolioPage } from '@/components/portfolio-page';

export default function Home() {
  return (
    <LanguageProvider>
      <PortfolioPage />
    </LanguageProvider>
  );
}
