// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved. 2023
// SPDX-License-Identifier: Apache-2.0

import { TimeSync } from '@iot-app-kit/react-components';
import { useMemo } from 'react';

import { CHART_ALARM_THRESHOLDS, CHART_COLOR_POOL, VIEWPORT } from '@/config/project';
import { LineChart, StatusTimeline } from '@/lib/components/charts';
import { createClassName, type ClassName } from '@/lib/core/utils/element';
import { normalizedEntityData } from '@/lib/init/entities';
import { useAlarmHistoryQueriesStore, useSelectedStore, useSummaryStore } from '@/lib/stores/entity';
import { usePanelsStore } from '@/lib/stores/panels';
import type { StyleSettingsMap } from '@/lib/types';
import { createHistoryQueries, isEntityWithProperties } from '@/lib/utils/entity';

import '@iot-app-kit/react-components/styles.css';
import css from './styles.module.css';

const ALL_COMPONENTS_TEXT = 'Alarm Status: All Equipment';
const ALARM_STATUS_TEXT = 'Alarm Status';
const PROPERTY_DETAIL_TEXT = 'Property Detail';

export function DashboardPanel({ className }: { className?: ClassName; entityId?: string }) {
  const [alarmHistoryQueries] = useAlarmHistoryQueriesStore();
  const [panels] = usePanelsStore();
  const [selectedEntity] = useSelectedStore();
  const [entitySummaries] = useSummaryStore();

  const entityAlarmStyles = useMemo(() => {
    return normalizedEntityData.reduce<StyleSettingsMap>((accum, entityData) => {
      if (entitySummaries) {
        if (isEntityWithProperties(entityData)) {
          const { name, properties } = entityData;
          const property = properties.find(({ type }) => type === 'alarm');

          if (property) {
            const {
              propertyQueryInfo: { refId }
            } = property;

            if (refId) {
              accum[refId] = { detailedName: name, name };
            }
          }
        }
      }

      return accum;
    }, {});
  }, [entitySummaries]);

  const entityDataStyles = useMemo(() => {
    return normalizedEntityData.reduce<StyleSettingsMap>((accum, entityData) => {
      if (entitySummaries) {
        if (isEntityWithProperties(entityData)) {
          const { properties } = entityData;

          properties
            .filter(({ type }) => type === 'data')
            .forEach(({ propertyQueryInfo: { propertyName, refId }, unit }, index) => {
              if (refId) {
                accum[refId] = {
                  detailedName: propertyName,
                  name: propertyName,
                  color: CHART_COLOR_POOL[index],
                  unit
                };
              }
            });
        }
      }

      return accum;
    }, {});
  }, [entitySummaries]);

  const lineChartElements = useMemo(() => {
    if (selectedEntity.entityData && isEntityWithProperties(selectedEntity.entityData)) {
      const historyQueries = createHistoryQueries(selectedEntity.entityData, 'data');

      return historyQueries.map((query) => {
        return (
          <LineChart
            axis={{ showX: true, showY: true }}
            historyQueries={[query]}
            key={crypto.randomUUID()}
            styles={entityDataStyles}
          />
        );
      });
    }

    return null;
  }, [selectedEntity, entityDataStyles]);

  const statusTimelineElement = useMemo(() => {
    if (selectedEntity.entityData && isEntityWithProperties(selectedEntity.entityData)) {
      const historyQueries = createHistoryQueries(selectedEntity.entityData, 'alarm');

      return (
        <StatusTimeline
          key={crypto.randomUUID()}
          historyQueries={historyQueries}
          thresholds={CHART_ALARM_THRESHOLDS}
          styles={entityAlarmStyles}
        />
      );
    } else if (alarmHistoryQueries.length) {
      return (
        <StatusTimeline
          key={crypto.randomUUID()}
          historyQueries={alarmHistoryQueries}
          thresholds={CHART_ALARM_THRESHOLDS}
          styles={entityAlarmStyles}
        />
      );
    }

    return null;
  }, [alarmHistoryQueries, entityAlarmStyles, selectedEntity]);

  return useMemo(() => {
    return (
      <main
        className={createClassName(css.root, className, { [css.multi]: selectedEntity.entityData !== null })}
        key={crypto.randomUUID()}
      >
        <TimeSync initialViewport={VIEWPORT}>
          <div className={css.name}>{selectedEntity.entityData ? ALARM_STATUS_TEXT : ALL_COMPONENTS_TEXT}</div>
          {statusTimelineElement}
          {lineChartElements && (
            <>
              <div className={css.name}>{PROPERTY_DETAIL_TEXT}</div>
              {lineChartElements}
            </>
          )}
        </TimeSync>
      </main>
    );
  }, [panels, selectedEntity, statusTimelineElement, lineChartElements]);
}
