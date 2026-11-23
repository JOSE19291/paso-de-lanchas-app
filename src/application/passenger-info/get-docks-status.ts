import { type Clock, systemClock } from "@/application/shared/ports";
import { estimateArrival, estimateDeparture } from "@/domain/passenger-info/eta";

import type { PassengerInfoRepository, VesselKindCode } from "./ports";

export interface BoardingVesselView {
  departureId: string;
  vesselName: string;
  vesselKind: VesselKindCode;
  vesselColor: string | null;
  vesselPhotoUrl: string | null;
  passengerCapacity: number;
  occupiedSeats: number;
  driverName: string | null;
  estimatedDepartureLabel: string;
  estimatedDepartureIso: string | null;
}

export interface InboundVesselView {
  departureId: string;
  originDockName: string;
  vesselName: string;
  vesselKind: VesselKindCode;
  vesselColor: string | null;
  vesselPhotoUrl: string | null;
  estimatedArrivalLabel: string;
  estimatedArrivalIso: string | null;
}

export interface DockStatusView {
  dockId: string;
  dockCode: string;
  dockName: string;
  boarding: BoardingVesselView | null;
  inbound: InboundVesselView | null;
}

export interface DocksStatusResult {
  updatedAtIso: string;
  crossingMinutes: number;
  docks: DockStatusView[];
}

export interface GetDocksStatusDeps {
  repo: PassengerInfoRepository;
  clock?: Clock;
}

export function createGetDocksStatus(deps: GetDocksStatusDeps) {
  const clock = deps.clock ?? systemClock;

  return async function getDocksStatus(): Promise<DocksStatusResult> {
    const now = clock.now();
    const snapshot = await deps.repo.getDocksLiveSnapshot();

    const docks: DockStatusView[] = snapshot.docks.map((dock) => {
      const boardingRow =
        snapshot.boardingDepartures.find((d) => d.originDockId === dock.id) ?? null;
      const inboundRow =
        snapshot.inboundDepartures.find((d) => d.destinationDockId === dock.id) ?? null;

      let boarding: BoardingVesselView | null = null;
      if (boardingRow) {
        const eta = estimateDeparture(
          boardingRow.passengerCapacity,
          boardingRow.occupiedSeats,
          boardingRow.boardingStartedAt,
          now,
        );
        boarding = {
          departureId: boardingRow.id,
          vesselName: boardingRow.vesselName,
          vesselKind: boardingRow.vesselKind,
          vesselColor: boardingRow.vesselColor,
          vesselPhotoUrl: boardingRow.vesselPhotoUrl,
          passengerCapacity: boardingRow.passengerCapacity,
          occupiedSeats: boardingRow.occupiedSeats,
          driverName: boardingRow.driverName,
          estimatedDepartureLabel: eta.label,
          estimatedDepartureIso: eta.estimatedAt ? eta.estimatedAt.toISOString() : null,
        };
      }

      let inbound: InboundVesselView | null = null;
      if (inboundRow) {
        const eta = estimateArrival(inboundRow.departedAt, snapshot.crossingMinutes, now);
        inbound = {
          departureId: inboundRow.id,
          originDockName: inboundRow.originDockName,
          vesselName: inboundRow.vesselName,
          vesselKind: inboundRow.vesselKind,
          vesselColor: inboundRow.vesselColor,
          vesselPhotoUrl: inboundRow.vesselPhotoUrl,
          estimatedArrivalLabel: eta.label,
          estimatedArrivalIso: eta.estimatedAt ? eta.estimatedAt.toISOString() : null,
        };
      }

      return {
        dockId: dock.id,
        dockCode: dock.code,
        dockName: dock.name,
        boarding,
        inbound,
      };
    });

    return {
      updatedAtIso: now.toISOString(),
      crossingMinutes: snapshot.crossingMinutes,
      docks,
    };
  };
}
