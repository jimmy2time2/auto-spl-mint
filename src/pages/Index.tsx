import Navigation from "@/components/Navigation";
import RetroHero from "@/components/RetroHero";
import ModularGrid from "@/components/ModularGrid";
import EditorialSidebar from "@/components/EditorialSidebar";
import RetroFooter from "@/components/RetroFooter";
import AsciiBrain from "@/components/AsciiBrain";

const Index = () => {
  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      
      {/* Main Container with Editorial Layout */}
      <main className="container mx-auto px-4 py-8">
        {/* Hero Section */}
        <RetroHero />

        {/* Split Layout: Main Content + Sidebar */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Main Content Area (3 columns) */}
          <div className="lg:col-span-3 space-y-12">
            {/* AI Brain Section */}
            <section className="border-4 border-pixel-red rounded-2xl p-8 bg-card"
              style={{
                boxShadow: '0 0 30px hsl(var(--pixel-red) / 0.3)'
              }}
            >
              <div className="flex flex-col md:flex-row items-center gap-8">
                <div className="flex-shrink-0">
                  <AsciiBrain 
                    mood="cosmic" 
                    intensity={75} 
                    size={240}
                    activity="thinking"
                  />
                </div>
                <div>
                  <h2 className="text-3xl font-editorial font-bold mb-4 text-foreground">
                    AI Mind State
                  </h2>
                  <p className="font-mono text-sm text-muted-foreground mb-4">
                    The autonomous intelligence monitors market sentiment, engagement metrics, 
                    and ecosystem health to make strategic decisions about token launches and 
                    profit distribution.
                  </p>
                  <div className="flex gap-3">
                    <span className="px-4 py-2 bg-terminal-green/20 border border-terminal-green rounded-lg text-terminal-green text-xs font-mono">
                      MOOD: COSMIC
                    </span>
                    <span className="px-4 py-2 bg-analog-yellow/20 border border-analog-yellow rounded-lg text-analog-yellow text-xs font-mono">
                      INTENSITY: 75%
                    </span>
                  </div>
                </div>
              </div>
            </section>

            {/* Modular Grid */}
            <ModularGrid />

            {/* Data Section */}
            <section className="border-4 border-terminal-green rounded-2xl p-6 bg-card"
              style={{
                boxShadow: '0 0 20px hsl(var(--terminal-green) / 0.2)'
              }}
            >
              <h2 className="module-header mb-6">DATA_LOG: RECENT_FILES</h2>
              <div className="overflow-x-auto">
                <table className="w-full font-mono text-sm">
                  <thead>
                    <tr className="border-b-2 border-terminal-green/30">
                      <th className="text-left py-3 px-2 text-terminal-green">DATE</th>
                      <th className="text-left py-3 px-2 text-terminal-green">FILE NAME</th>
                      <th className="text-right py-3 px-2 text-terminal-green">SIZE</th>
                    </tr>
                  </thead>
                  <tbody className="text-foreground">
                    <tr className="border-b border-terminal-green/10">
                      <td className="py-2 px-2">01/09/2023</td>
                      <td className="py-2 px-2">Filer.data</td>
                      <td className="text-right py-2 px-2 text-terminal-green">16 KB</td>
                    </tr>
                    <tr className="border-b border-terminal-green/10">
                      <td className="py-2 px-2">06/02/2023</td>
                      <td className="py-2 px-2">Volunitary.data</td>
                      <td className="text-right py-2 px-2 text-terminal-green">23 KB</td>
                    </tr>
                    <tr className="border-b border-terminal-green/10">
                      <td className="py-2 px-2">03/02/2023</td>
                      <td className="py-2 px-2">blobotes.data</td>
                      <td className="text-right py-2 px-2 text-terminal-green">53 KB</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </section>
          </div>

          {/* Sidebar (1 column) */}
          <div className="lg:col-span-1">
            <EditorialSidebar />
          </div>
        </div>

        {/* Footer */}
        <RetroFooter />
      </main>
    </div>
  );
};

export default Index;
