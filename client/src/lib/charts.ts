import { Chart, ChartConfiguration, ChartTypeRegistry } from "chart.js";

export type MoodData = {
  date: Date;
  rating: number;
};

export function formatDateForChart(date: Date): string {
  return date.getDate().toString();
}

export function createMoodChart(
  ctx: HTMLCanvasElement,
  data: MoodData[],
  type: keyof ChartTypeRegistry = "line"
): Chart {
  const sortedData = [...data].sort((a, b) => a.date.getTime() - b.date.getTime());
  
  const labels = sortedData.map(d => formatDateForChart(d.date));
  const values = sortedData.map(d => d.rating);
  
  const config: ChartConfiguration = {
    type: type,
    data: {
      labels,
      datasets: [
        {
          label: "気分スコア",
          data: values,
          borderColor: "hsl(var(--secondary-500))",
          backgroundColor: "hsla(var(--secondary-500), 0.2)",
          tension: 0.3,
          fill: true,
        },
      ],
    },
    options: {
      responsive: true,
      plugins: {
        legend: {
          display: false,
        },
        tooltip: {
          mode: "index",
          intersect: false,
        },
      },
      scales: {
        y: {
          beginAtZero: true,
          max: 10,
          ticks: {
            stepSize: 2,
          },
        },
      },
    },
  };
  
  return new Chart(ctx, config);
}

export function createBarChart(
  ctx: HTMLCanvasElement,
  data: MoodData[],
): Chart {
  const sortedData = [...data].sort((a, b) => a.date.getTime() - b.date.getTime());
  
  const labels = sortedData.map(d => formatDateForChart(d.date));
  const values = sortedData.map(d => d.rating);
  
  const config: ChartConfiguration = {
    type: "bar",
    data: {
      labels,
      datasets: [
        {
          label: "気分スコア",
          data: values,
          backgroundColor: values.map(value => {
            // Color changes based on rating
            if (value <= 3) return "hsla(var(--destructive), 0.7)";
            if (value <= 5) return "hsla(var(--accent-500), 0.7)";
            if (value <= 7) return "hsla(var(--secondary-400), 0.7)";
            return "hsla(var(--secondary-600), 0.7)";
          }),
          borderRadius: 4,
        },
      ],
    },
    options: {
      responsive: true,
      plugins: {
        legend: {
          display: false,
        },
      },
      scales: {
        y: {
          beginAtZero: true,
          max: 10,
          ticks: {
            stepSize: 2,
          },
        },
      },
    },
  };
  
  return new Chart(ctx, config);
}

export function createGoalProgressChart(
  ctx: HTMLCanvasElement,
  progress: number,
): Chart {
  const config: ChartConfiguration = {
    type: "doughnut",
    data: {
      labels: ["完了", "未完了"],
      datasets: [
        {
          data: [progress, 100 - progress],
          backgroundColor: [
            "hsla(var(--primary-500), 0.8)",
            "hsla(var(--muted), 0.5)",
          ],
          borderWidth: 0,
        },
      ],
    },
    options: {
      responsive: true,
      cutout: "75%",
      plugins: {
        legend: {
          display: false,
        },
        tooltip: {
          enabled: false,
        },
      },
    },
  };
  
  return new Chart(ctx, config);
}
