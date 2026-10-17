import { getHealth } from '@/lib/api-client';

export default async function Home() {
  let status = 'Offline';
  let service = 'Backend API';

  try {
    const health = await getHealth();
    status = health.status === 'ok' ? 'Online' : 'Unhealthy';
    service = health.service;
  } catch {
    status = 'Offline';
  }

  return (
    <main className="mx-auto min-h-screen max-w-4xl px-6 py-20">
      <h1 className="text-4xl font-bold">Backend Portfolio</h1>

      <p className="mt-4 text-gray-500">Interactive API Engineering Playground</p>

      <section className="mt-10 rounded-xl border p-6">
        <h2 className="text-xl font-semibold">Backend Health</h2>

        <p className="mt-4">Service: {service}</p>

        <p>
          Status:{' '}
          <span
            className={
              status === 'Online' ? 'font-semibold text-green-600' : 'font-semibold text-red-600'
            }
          >
            {status}
          </span>
        </p>
      </section>
    </main>
  );
}
