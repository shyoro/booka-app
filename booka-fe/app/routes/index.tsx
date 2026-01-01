import type { Route } from "./+types/index";

/**
 * Home page - placeholder for proper layout and pages structure
 */
export function meta({}: Route.MetaArgs) {
  return [
    { title: "Booka App" },
    { name: "description", content: "Booka booking application" },
  ];
}

export default function Index() {
  return (
    <main className="flex items-center justify-center min-h-screen">
      <div className="text-center">
        <h1 className="text-4xl font-bold mb-4">Booka App</h1>
        <p className="text-gray-600 dark:text-gray-400">
          Ready to build your layout and pages structure
        </p>
      </div>
    </main>
  );
}

