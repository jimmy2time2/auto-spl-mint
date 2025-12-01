import { Sun, Circle, Menu } from "lucide-react";

const ModularGrid = () => {
  const cards = [
    { 
      id: 1, 
      title: "VACANCIES", 
      number: "3", 
      bg: "digital-blue",
      size: "large"
    },
    { 
      id: 2, 
      title: "LEAD GENERATION MANAGER", 
      subtitle: "FULLTIME",
      number: "1/3", 
      bg: "muted-peach",
      textDark: true,
      icon: <Sun className="w-8 h-8" />
    },
    { 
      id: 3, 
      title: "INTERFACE DESIGNER", 
      subtitle: "FULLTIME",
      number: "2/3", 
      bg: "background",
      size: "tall"
    },
    { 
      id: 4, 
      title: "INTERFACE DESIGNER", 
      subtitle: "FULLTIME",
      bg: "analog-yellow",
      textDark: true
    },
    { 
      id: 5, 
      title: "SOCIAL MEDIA UI DESIGNER", 
      subtitle: "FULLTIME",
      bg: "muted-peach",
      textDark: true
    },
    { 
      id: 6, 
      title: "ポータル", 
      bg: "background",
      vertical: true
    },
    { 
      id: 7, 
      title: "CALLING..", 
      bg: "analog-yellow",
      textDark: true,
      wide: true
    },
  ];

  return (
    <section className="mb-16">
      <h2 className="module-header mb-6 text-2xl">ACTIVE MODULES</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4 auto-rows-fr">
        {cards.map((card) => (
          <div
            key={card.id}
            className={`
              ${card.bg.startsWith('#') ? '' : `bg-${card.bg}`}
              ${card.size === 'large' ? 'md:col-span-2 md:row-span-2' : ''}
              ${card.size === 'tall' ? 'md:row-span-2' : ''}
              ${card.wide ? 'md:col-span-2' : ''}
              ${card.vertical ? 'md:row-span-2' : ''}
              rounded-2xl p-6 border-4 
              ${card.textDark ? 'border-background text-background' : 'border-terminal-green text-terminal-green'}
              relative overflow-hidden group hover:scale-[1.02] transition-transform cursor-pointer
            `}
            style={{
              backgroundColor: card.bg.startsWith('hsl') ? card.bg : undefined,
              boxShadow: card.textDark 
                ? '0 4px 20px rgba(0,0,0,0.1)' 
                : '0 0 20px hsl(var(--terminal-green) / 0.2)'
            }}
          >
            {/* Content */}
            <div className="relative z-10 h-full flex flex-col justify-between">
              {card.icon && (
                <div className="mb-4">
                  {card.icon}
                </div>
              )}
              
              {card.number && !card.vertical && (
                <div className="text-5xl font-bold mb-2 font-mono">
                  {card.number}
                </div>
              )}
              
              <div>
                <h3 className={`font-mono font-bold ${card.size === 'large' ? 'text-2xl' : 'text-sm'} ${card.vertical ? 'writing-mode-vertical-rl text-3xl' : ''} mb-2`}>
                  {card.title}
                </h3>
                {card.subtitle && (
                  <p className="text-xs opacity-70 font-mono">{card.subtitle}</p>
                )}
              </div>
            </div>

            {/* Hover effect */}
            <div className={`absolute inset-0 ${card.textDark ? 'bg-background' : 'bg-terminal-green'} opacity-0 group-hover:opacity-10 transition-opacity`} />
          </div>
        ))}
      </div>
    </section>
  );
};

export default ModularGrid;
