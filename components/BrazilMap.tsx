"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { ComposableMap, Geographies, Geography } from "react-simple-maps";

const GEO_URL =
  "https://raw.githubusercontent.com/codeforamerica/click_that_hood/master/public/data/brazil-states.geojson";

type Props = { counts?: Record<string, number>; hrefPrefix?: string };

export function BrazilMap({ counts = {}, hrefPrefix = "/estado" }: Props) {
  const [hover, setHover] = useState<string | null>(null);
  const max = Math.max(1, ...Object.values(counts));

  const fill = useMemo(() => (uf: string) => {
    const value = counts[uf] ?? 0;
    if (!value) return "#e8edf2";
    const opacity = 0.25 + (value / max) * 0.7;
    return `rgba(0,155,91,${opacity})`;
  }, [counts, max]);

  return (
    <div className="map-wrap">
      <ComposableMap projection="geoMercator" projectionConfig={{ scale: 650, center: [-53, -14] }} width={800} height={620} style={{width:"100%",height:"100%"}}>
        <Geographies geography={GEO_URL}>
          {({ geographies }) =>
            geographies.map((geo: any) => {
              const uf = geo.properties.sigla || geo.properties.SIGLA || geo.properties.uf;
              const name = geo.properties.name || geo.properties.NOME;
              return (
                <Link key={geo.rsmKey} href={`${hrefPrefix}/${uf}`}>
                  <Geography
                    geography={geo}
                    className="state-shape"
                    onMouseEnter={() => setHover(name || uf)}
                    onMouseLeave={() => setHover(null)}
                    style={{
                      default: { fill: fill(uf), outline: "none", stroke:"#fff", strokeWidth:0.7 },
                      hover: { fill:"#69c995", outline:"none", stroke:"#075d3b", strokeWidth:1.2 },
                      pressed: { fill:"#009b5b", outline:"none" }
                    }}
                  />
                </Link>
              );
            })
          }
        </Geographies>
      </ComposableMap>
      {hover && <div style={{textAlign:"center",fontWeight:800,marginTop:-35,position:"relative"}}>{hover}</div>}
    </div>
  );
}
