import { Cloud, CloudRain, Sun } from "lucide-react";

interface WeatherWidgetProps {
  city: string;
  temp: string;
  condition: "sunny" | "cloudy" | "rainy";
}

export const WeatherWidget = ({ city, temp, condition }: WeatherWidgetProps) => {
  const icons = {
    sunny: <Sun className="w-8 h-8" />,
    cloudy: <Cloud className="w-8 h-8" />,
    rainy: <CloudRain className="w-8 h-8" />
  };

  return (
    <div className="border-2 border-foreground p-4 bg-background">
      <div className="flex items-center gap-3">
        {icons[condition]}
        <div>
          <div className="text-[10px] font-bold tracking-widest mb-1">{city}</div>
          <div className="text-2xl font-bold">{temp}</div>
        </div>
      </div>
    </div>
  );
};
