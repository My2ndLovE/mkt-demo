import type { Route } from './+types/_index';
import { Link } from 'react-router';

export function meta({}: Route.MetaArgs) {
  return [
    { title: 'Lottery Sandbox - Multi-Level Agent System' },
    { name: 'description', content: 'Practice lottery management system for agents' },
  ];
}

export default function Index() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-br from-blue-500 to-purple-600 p-4">
      <div className="w-full max-w-md space-y-8 rounded-lg bg-white p-8 shadow-2xl">
        <div className="text-center">
          <h1 className="text-4xl font-bold text-gray-900">Lottery Sandbox</h1>
          <p className="mt-2 text-sm text-gray-600">Multi-Level Agent System</p>
        </div>

        <div className="mt-8 space-y-4">
          <Link
            to="/login"
            className="block w-full rounded-lg bg-blue-600 px-4 py-3 text-center font-semibold text-white shadow-md transition hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
          >
            Login
          </Link>

          <div className="text-center text-sm text-gray-500">
            <p>Default credentials:</p>
            <p className="mt-1 font-mono text-xs">
              admin / Admin@123456
            </p>
          </div>
        </div>

        <div className="mt-6 grid grid-cols-2 gap-4 text-center">
          <div className="rounded-lg border border-gray-200 p-4">
            <p className="text-2xl font-bold text-blue-600">4</p>
            <p className="text-xs text-gray-600">Providers</p>
          </div>
          <div className="rounded-lg border border-gray-200 p-4">
            <p className="text-2xl font-bold text-purple-600">∞</p>
            <p className="text-xs text-gray-600">Hierarchy Levels</p>
          </div>
          <div className="rounded-lg border border-gray-200 p-4">
            <p className="text-2xl font-bold text-green-600">3</p>
            <p className="text-xs text-gray-600">User Roles</p>
          </div>
          <div className="rounded-lg border border-gray-200 p-4">
            <p className="text-2xl font-bold text-orange-600">6</p>
            <p className="text-xs text-gray-600">Reports</p>
          </div>
        </div>

        <div className="mt-6 text-center text-xs text-gray-500">
          <p>Version 1.0.0 | © 2025</p>
        </div>
      </div>
    </div>
  );
}
