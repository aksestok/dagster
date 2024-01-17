import {render, waitFor, screen} from '@testing-library/react';
import React from 'react';
import {buildMutationMock, buildQueryMock, getMockResultFn} from '../../testing/mocking';
import {PARTITION_HEALTH_QUERY} from '../usePartitionHealthData';
import {
  buildAssetNode,
  buildDimensionPartitionKeys,
  PartitionDefinitionType,
  buildMultiPartitionStatuses,
  buildAssetKey,
  buildAddDynamicPartitionSuccess,
} from '../../graphql/types';
import {
  PartitionHealthQuery,
  PartitionHealthQueryVariables,
} from '../types/usePartitionHealthData.types';
import {LaunchAssetChoosePartitionsDialog} from '../LaunchAssetChoosePartitionsDialog';
import {MockedProvider} from '@apollo/client/testing';
import {RepoAddress} from '../../workspace/types';
import {LaunchAssetsChoosePartitionsTarget} from '../LaunchAssetExecutionButton';
import userEvent from '@testing-library/user-event';
import {MemoryRouter} from 'react-router';
import {buildRepoAddress} from '../../workspace/buildRepoAddress';
import {
  AddDynamicPartitionMutation,
  AddDynamicPartitionMutationVariables,
} from '../../partitions/types/CreatePartitionDialog.types';
import {CREATE_PARTITION_MUTATION} from '../../partitions/CreatePartitionDialog';

describe('launchAssetChoosePartitionsDialog', () => {
  it('Adding a dynamic partition when multiple assets selected', async () => {
    const errorMock = jest.fn();
    // jest.spyOn(console, 'error').mockImplementation(() => errorMock);

    const assetA = buildAsset('asset_a', ['test']);
    const assetB = buildAsset('asset_b', ['test']);

    const assetAQueryMock = buildQueryMock<PartitionHealthQuery, PartitionHealthQueryVariables>({
      query: PARTITION_HEALTH_QUERY,
      variables: {assetKey: {path: ['asset_a']}},
      data: {assetNodeOrError: assetA},
    });
    const assetBQueryMock = buildQueryMock<PartitionHealthQuery, PartitionHealthQueryVariables>({
      query: PARTITION_HEALTH_QUERY,
      variables: {assetKey: {path: ['asset_b']}},
      data: {assetNodeOrError: assetB},
    });
    const assetASecondQueryMock = buildQueryMock<
      PartitionHealthQuery,
      PartitionHealthQueryVariables
    >({
      query: PARTITION_HEALTH_QUERY,
      variables: {assetKey: {path: ['asset_a']}},
      data: {assetNodeOrError: buildAsset('asset_a', ['test', 'test2'])},
    });
    const assetBSecondQueryMock = buildQueryMock<
      PartitionHealthQuery,
      PartitionHealthQueryVariables
    >({
      query: PARTITION_HEALTH_QUERY,
      variables: {assetKey: {path: ['asset_b']}},
      data: {assetNodeOrError: buildAsset('asset_b', ['test', 'test2'])},
      delay: 5000,
    });

    const addPartitionMock = buildMutationMock<
      AddDynamicPartitionMutation,
      AddDynamicPartitionMutationVariables
    >({
      query: CREATE_PARTITION_MUTATION,
      variables: {
        repositorySelector: {repositoryName: 'test', repositoryLocationName: 'test'},
        partitionsDefName: 'facilis',
        partitionKey: 'test2',
      },
      data: {
        addDynamicPartition: buildAddDynamicPartitionSuccess(),
      },
    });

    const assetAQueryMockResult = getMockResultFn(assetAQueryMock);
    const assetBQueryMockResult = getMockResultFn(assetBQueryMock);
    const assetASecondQueryMockResult = getMockResultFn(assetASecondQueryMock);
    const assetBSecondQueryMockResult = getMockResultFn(assetBSecondQueryMock);
    render(
      <MemoryRouter>
        <MockedProvider
          mocks={[
            assetAQueryMock,
            assetBQueryMock,
            assetASecondQueryMock,
            assetBSecondQueryMock,
            addPartitionMock,
          ]}
        >
          <LaunchAssetChoosePartitionsDialog
            open={true}
            setOpen={(_open: boolean) => {}}
            repoAddress={buildRepoAddress('test', 'test')}
            target={{
              jobName: '__ASSET_JOB_0',
              partitionSetName: '__ASSET_JOB_0_partition_set',
              type: 'job',
            }}
            assets={[assetA, assetB]}
            upstreamAssetKeys={[]}
          />
        </MockedProvider>
      </MemoryRouter>,
    );

    await waitFor(() => {
      expect(assetAQueryMockResult).toHaveBeenCalled();
      expect(assetBQueryMockResult).toHaveBeenCalled();
    });

    const link = await waitFor(() => screen.getByTestId('add-partition-link'));
    userEvent.click(link);
    const partitionInput = await waitFor(() => screen.getByTestId('partition-input'));
    await userEvent.type(partitionInput, 'test2');
    expect(assetASecondQueryMockResult).not.toHaveBeenCalled();
    expect(assetBSecondQueryMockResult).not.toHaveBeenCalled();
    const savePartitionButton = screen.getByTestId('save-partition-button');
    userEvent.click(savePartitionButton);

    await waitFor(() => {
      expect(assetASecondQueryMockResult).toHaveBeenCalled();
    });

    expect(errorMock).not.toHaveBeenCalled();
  });
});

function buildAsset(name: string, dynamicPartitionKeys: string[]) {
  return buildAssetNode({
    assetKey: buildAssetKey({path: [name]}),
    id: `repro_dynamic_in_multipartitions_bug.py.__repository__.["${name}"]`,
    partitionKeysByDimension: [
      buildDimensionPartitionKeys({
        name: 'a',
        type: PartitionDefinitionType.DYNAMIC,
        partitionKeys: dynamicPartitionKeys,
      }),
      buildDimensionPartitionKeys({
        name: 'b',
        type: PartitionDefinitionType.TIME_WINDOW,
        partitionKeys: ['2024-01-01'],
      }),
    ],
    assetPartitionStatuses: buildMultiPartitionStatuses({
      primaryDimensionName: 'b',
      ranges: [],
    }),
  });
}
