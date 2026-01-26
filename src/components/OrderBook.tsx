import { useMemo } from "react";

interface Order {
  price: number;
  size: number;
  total: number;
}

interface OrderBookProps {
  currentPrice: number;
  depth?: number;
}

const OrderBook = ({ currentPrice, depth = 8 }: OrderBookProps) => {
  // Generate mock order book data
  const { bids, asks } = useMemo(() => {
    const bids: Order[] = [];
    const asks: Order[] = [];
    
    let bidTotal = 0;
    let askTotal = 0;
    
    for (let i = 0; i < depth; i++) {
      const bidSize = Math.random() * 10000 + 1000;
      const askSize = Math.random() * 10000 + 1000;
      
      bidTotal += bidSize;
      askTotal += askSize;
      
      bids.push({
        price: currentPrice * (1 - (i + 1) * 0.005),
        size: bidSize,
        total: bidTotal,
      });
      
      asks.unshift({
        price: currentPrice * (1 + (depth - i) * 0.005),
        size: askSize,
        total: askTotal,
      });
    }
    
    return { bids, asks };
  }, [currentPrice, depth]);
  
  const maxTotal = Math.max(
    bids[bids.length - 1]?.total || 0,
    asks[0]?.total || 0
  );
  
  const formatPrice = (price: number) => price.toFixed(6);
  const formatSize = (size: number) => {
    if (size >= 1000) return `${(size / 1000).toFixed(1)}K`;
    return size.toFixed(0);
  };

  return (
    <div className="border border-border">
      <div className="border-b border-border px-3 py-2 bg-muted">
        <span className="data-sm">ORDER BOOK</span>
      </div>
      
      {/* Header */}
      <div className="grid grid-cols-3 px-2 py-1 border-b border-border text-[9px] text-muted-foreground">
        <span>PRICE</span>
        <span className="text-right">SIZE</span>
        <span className="text-right">TOTAL</span>
      </div>
      
      {/* Asks (sells) */}
      <div className="divide-y divide-border/30">
        {asks.map((order, i) => (
          <div key={`ask-${i}`} className="relative grid grid-cols-3 px-2 py-1 text-xs">
            {/* Depth visualization */}
            <div 
              className="absolute right-0 top-0 bottom-0 bg-red-500/10"
              style={{ width: `${(order.total / maxTotal) * 100}%` }}
            />
            <span className="relative text-red-500 tabular-nums">{formatPrice(order.price)}</span>
            <span className="relative text-right tabular-nums">{formatSize(order.size)}</span>
            <span className="relative text-right tabular-nums text-muted-foreground">{formatSize(order.total)}</span>
          </div>
        ))}
      </div>
      
      {/* Spread */}
      <div className="px-2 py-2 border-y border-border bg-muted text-center">
        <span className="data-sm">${formatPrice(currentPrice)}</span>
        <span className="text-[9px] text-muted-foreground ml-2">
          SPREAD: {((asks[asks.length - 1]?.price - bids[0]?.price) / currentPrice * 100).toFixed(2)}%
        </span>
      </div>
      
      {/* Bids (buys) */}
      <div className="divide-y divide-border/30">
        {bids.map((order, i) => (
          <div key={`bid-${i}`} className="relative grid grid-cols-3 px-2 py-1 text-xs">
            {/* Depth visualization */}
            <div 
              className="absolute left-0 top-0 bottom-0 bg-green-500/10"
              style={{ width: `${(order.total / maxTotal) * 100}%` }}
            />
            <span className="relative text-green-500 tabular-nums">{formatPrice(order.price)}</span>
            <span className="relative text-right tabular-nums">{formatSize(order.size)}</span>
            <span className="relative text-right tabular-nums text-muted-foreground">{formatSize(order.total)}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default OrderBook;
