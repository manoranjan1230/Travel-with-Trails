import { ErrorBoundary } from '@/components/error-boundary';
import { Router as WouterRouter } from 'wouter';
import { Router } from '@/app/Router';

export default function App() {
  return <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, '')}><ErrorBoundary><Router /></ErrorBoundary></WouterRouter>;
}
