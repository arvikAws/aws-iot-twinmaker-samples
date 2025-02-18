// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved. 2023
// SPDX-License-Identifier: Apache-2.0

import { useMemo } from 'react';

import { ArrowRightIcon, GlobeIcon } from '@/lib/components/svgs/icons';
import { createClassName, type ClassName } from '@/lib/core/utils/element';
import { isNil } from '@/lib/core/utils/lang';
import { useSummaryStore, useSelectedStore } from '@/lib/stores/entity';
import { useSiteStore } from '@/lib/stores/site';

import styles from './styles.module.css';

const UNKNOWN_ENTITY_NAME = 'UNKNOWN ENTITY';

export function HierarchyNavigator({ className }: { className?: ClassName }) {
  const [entitySummaries] = useSummaryStore();
  const [{ entityData }] = useSelectedStore();
  const [site, setSite] = useSiteStore();

  const contentElement = useMemo(() => {
    if (entitySummaries && site) {
      const parents = walkParentEntities(entitySummaries, entityData?.entityId);

      return (
        <>
          <button className={styles.icon} onPointerUp={() => setSite(null)}>
            <GlobeIcon />
          </button>

          <span className={styles.seperator}>
            <ArrowRightIcon />
          </span>

          <span className={createClassName(styles.label, { [styles.active]: isNil(entityData) })}>{site.name}</span>

          {parents.length > 0 && parents.map((parent) => <Crumb key={parent.entityId} name={parent.entityName} />)}
          {entityData && (
            <Crumb
              key={entityData.entityId}
              isActive={true}
              name={entitySummaries[entityData.entityId]?.entityName ?? UNKNOWN_ENTITY_NAME}
            />
          )}
        </>
      );
    }

    return null;
  }, [entitySummaries, entityData, site]);

  return <section className={createClassName(styles.root, className)}>{contentElement}</section>;
}

function Crumb({ isActive = false, name }: { isActive?: boolean; name: string }) {
  return (
    <>
      <span className={styles.seperator}>
        <ArrowRightIcon />
      </span>
      <span className={createClassName(styles.label, { [styles.active]: isActive })}>{name}</span>
    </>
  );
}

function walkParentEntities(entities: ReturnType<typeof useSummaryStore>[0], selectedEntityId?: string) {
  let parents: { entityId: string; entityName: string }[] = [];
  if (selectedEntityId) {
    let parentEntityId = entities[selectedEntityId]?.parentEntityId;
    while (parentEntityId) {
      const selectedEntity = entities[parentEntityId];
      if (selectedEntity?.entityId && selectedEntity?.entityName)
        parents.unshift({ entityId: selectedEntity.entityId, entityName: selectedEntity.entityName });
      parentEntityId = selectedEntity?.parentEntityId;
    }
  }
  return parents;
}
