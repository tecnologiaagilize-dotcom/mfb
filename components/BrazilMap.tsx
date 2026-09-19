"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import {
  ComposableMap,
  Geographies,
  Geography,
} from "react-simple-maps";

const GEO_URL =
  "https://raw.githubusercontent.com/codeforamerica/click_that_hood/master/public/data/brazil-states.geojson";

type Candidate = {
  id?: string;
  name: string;
  ballot_name?: string | null;
  slug?: string | null;
  state_uf: string;
  cargo?: string | null;
  party?: string | null;
  number?: string | null;
  photo_url?: string | null;
};

type BrazilMapProps = {
  counts?: Record<string, number>;
  candidates?: Candidate[];
};

function getUF(properties: any): string {
  return (
    properties?.sigla ||
    properties?.UF ||
    properties?.uf ||
    properties?.postal ||
    properties?.abbr ||
    ""
  )
    .toString()
    .toUpperCase();
}

export function BrazilMap({
  counts = {},
  candidates = [],
}: BrazilMapProps) {
  const [hoveredUF, setHoveredUF] =
    useState<string | null>(null);

  const candidatesByState = useMemo(() => {
    const grouped: Record<string, Candidate[]> = {};

    candidates.forEach((candidate) => {
      if (!candidate.state_uf) return;

      const uf = candidate.state_uf.toUpperCase();

      if (uf === "BR") return;

      if (!grouped[uf]) {
        grouped[uf] = [];
      }

      grouped[uf].push(candidate);
    });

    return grouped;
  }, [candidates]);

  const hoveredCandidates =
    hoveredUF && candidatesByState[hoveredUF]
      ? candidatesByState[hoveredUF]
      : [];

  return (
    <div
      style={{
        position: "relative",
        width: "100%",
        maxWidth: 850,
        margin: "0 auto",
      }}
    >
      <ComposableMap
        projection="geoMercator"
        projectionConfig={{
          center: [-54, -15],
          scale: 700,
        }}
        width={800}
        height={650}
        style={{
          width: "100%",
          height: "auto",
        }}
      >
        <Geographies geography={GEO_URL}>
          {({ geographies }: any) =>
            geographies.map((geo: any) => {
              const uf = getUF(geo.properties);
              const count = counts[uf] ?? 0;

              return (
                <Link
                  key={geo.rsmKey}
                  href={`/estado/${uf}`}
                >
                  <Geography
                    geography={geo}
                    onMouseEnter={() =>
                      setHoveredUF(uf)
                    }
                    onMouseLeave={() =>
                      setHoveredUF(null)
                    }
                    style={{
                      default: {
                        fill:
                          count > 0
                            ? "#157347"
                            : "#D9E2E8",
                        stroke: "#FFFFFF",
                        strokeWidth: 1.2,
                        outline: "none",
                        cursor: "pointer",
                      },

                      hover: {
                        fill:
                          count > 0
                            ? "#F4C430"
                            : "#AAB7C2",
                        stroke: "#FFFFFF",
                        strokeWidth: 1.5,
                        outline: "none",
                        cursor: "pointer",
                      },

                      pressed: {
                        fill: "#F4C430",
                        stroke: "#FFFFFF",
                        strokeWidth: 1.5,
                        outline: "none",
                      },
                    }}
                  />
                </Link>
              );
            })
          }
        </Geographies>
      </ComposableMap>

      {/* MOSAICO AO PASSAR O MOUSE */}
      {hoveredUF && (
        <div
          style={{
            position: "absolute",
            right: 10,
            top: 10,
            width: 330,
            maxWidth: "90%",
            background: "#ffffff",
            borderRadius: 16,
            padding: 18,
            boxShadow:
              "0 18px 50px rgba(16,24,40,.20)",
            border: "1px solid #e4e7ec",
            zIndex: 20,
          }}
          onMouseEnter={() =>
            setHoveredUF(hoveredUF)
          }
          onMouseLeave={() =>
            setHoveredUF(null)
          }
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              gap: 12,
              marginBottom: 14,
            }}
          >
            <div>
              <div
                style={{
                  fontSize: 12,
                  fontWeight: 800,
                  color: "#157347",
                  letterSpacing: 1,
                }}
              >
                APOIADOS PELO MFB
              </div>

              <h3
                style={{
                  margin: "3px 0 0",
                  fontSize: 25,
                }}
              >
                {hoveredUF}
              </h3>
            </div>

            <div
              style={{
                fontWeight: 800,
                fontSize: 13,
                background: "#f2f4f7",
                padding: "7px 10px",
                borderRadius: 20,
              }}
            >
              {hoveredCandidates.length}
            </div>
          </div>

          {hoveredCandidates.length === 0 ? (
            <p
              style={{
                color: "#667085",
                margin: 0,
              }}
            >
              Nenhum apoiado publicado neste
              estado.
            </p>
          ) : (
            <>
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns:
                    "repeat(3, 1fr)",
                  gap: 10,
                }}
              >
                {hoveredCandidates
                  .slice(0, 6)
                  .map((candidate) => (
                    <Link
                      key={
                        candidate.id ||
                        candidate.slug ||
                        candidate.name
                      }
                      href={
                        candidate.slug
                          ? `/candidato/${candidate.slug}`
                          : `/estado/${hoveredUF}`
                      }
                      style={{
                        textDecoration: "none",
                        color: "inherit",
                      }}
                    >
                      <div>
                        <div
                          style={{
                            width: "100%",
                            aspectRatio: "3 / 4",
                            borderRadius: 9,
                            overflow: "hidden",
                            background: "#eef2f4",
                          }}
                        >
                          {candidate.photo_url ? (
                            <img
                              src={
                                candidate.photo_url
                              }
                              alt={
                                candidate.ballot_name ||
                                candidate.name
                              }
                              style={{
                                width: "100%",
                                height: "100%",
                                objectFit: "cover",
                                display: "block",
                              }}
                            />
                          ) : (
                            <div
                              style={{
                                width: "100%",
                                height: "100%",
                                display: "flex",
                                alignItems:
                                  "center",
                                justifyContent:
                                  "center",
                                fontSize: 30,
                                color: "#98a2b3",
                              }}
                            >
                              👤
                            </div>
                          )}
                        </div>

                        <div
                          style={{
                            marginTop: 6,
                            fontWeight: 800,
                            fontSize: 12,
                            lineHeight: 1.25,
                          }}
                        >
                          {candidate.ballot_name ||
                            candidate.name}
                        </div>

                        <div
                          style={{
                            color: "#667085",
                            fontSize: 11,
                            marginTop: 2,
                          }}
                        >
                          {candidate.cargo}
                        </div>

                        {(candidate.party ||
                          candidate.number) && (
                          <div
                            style={{
                              color: "#157347",
                              fontSize: 11,
                              fontWeight: 700,
                              marginTop: 2,
                            }}
                          >
                            {candidate.party}
                            {candidate.party &&
                            candidate.number
                              ? " • "
                              : ""}
                            {candidate.number}
                          </div>
                        )}
                      </div>
                    </Link>
                  ))}
              </div>

              {hoveredCandidates.length > 6 && (
                <div
                  style={{
                    marginTop: 10,
                    color: "#667085",
                    fontSize: 12,
                  }}
                >
                  +{" "}
                  {hoveredCandidates.length - 6}{" "}
                  outros apoiados
                </div>
              )}

              <Link
                href={`/estado/${hoveredUF}`}
                style={{
                  display: "inline-block",
                  marginTop: 14,
                  fontWeight: 800,
                  color: "#157347",
                  textDecoration: "none",
                }}
              >
                Ver todos de {hoveredUF} →
              </Link>
            </>
          )}
        </div>
      )}
    </div>
  );
}
