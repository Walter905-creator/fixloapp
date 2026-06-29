import React from 'react';

export default function DashboardTable({ title, columns, rows, empty }) {
  return (
    <section className="dashboard-card">
      <div className="dashboard-card-header"><h3>{title}</h3></div>
      {rows.length === 0 ? (
        empty
      ) : (
        <div className="dashboard-table-wrap">
          <table className="dashboard-table">
            <thead>
              <tr>
                {columns.map((col) => <th key={col.key}>{col.label}</th>)}
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.id || row._id}>
                  {columns.map((col) => (
                    <td key={col.key}>{col.render ? col.render(row[col.key], row) : row[col.key]}</td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
