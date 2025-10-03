export default function Home() {
  return (
    <div style={{ fontFamily: 'system-ui, -apple-system, Segoe UI, Roboto, sans-serif', padding: 16 }}>
      <h1>Nieuwe App</h1>
      <p>API routes are deployed under <code>/api/*</code>.</p>
      <ul>
        <li><code>/api/generate-groepsplan</code> (POST)</li>
        <li><code>/api/upload-document</code> (POST)</li>
        <li><code>/api/export-word</code> (POST)</li>
      </ul>
    </div>
  );
}

