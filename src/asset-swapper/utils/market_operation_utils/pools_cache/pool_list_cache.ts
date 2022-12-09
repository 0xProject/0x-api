import { request } from 'graphql-request';
import gql from 'graphql-tag';

export const queryPools = (
	skip: number,
	pageSize: number,
	createdBy = '',
	dataProvider = ''
) => gql`
  {
    pools(first: ${pageSize}, skip: ${skip},
      orderDirection: desc,
      orderBy: createdAt,
      where: { 
        createdBy_contains: "${createdBy}"
        statusFinalReferenceValue_not: "Confirmed"
        dataProvider_contains: "${dataProvider}"
      }) {
      id
      referenceAsset
      floor
      inflection
      cap
      supplyShort
      supplyLong
      expiryTime
      collateralToken {
        id
        name
        decimals
        symbol
      }
      collateralBalanceGross
      gradient
      collateralBalance
      shortToken {
        id
        name
        symbol
        decimals
        owner
      }
      longToken {
        id
        name
        symbol
        decimals
        owner
      }
      finalReferenceValue
      statusFinalReferenceValue
      payoutLong
      payoutShort
      statusTimestamp
      dataProvider
      protocolFee
      settlementFee
      createdBy
      createdAt
      submissionPeriod
      challengePeriod
      reviewPeriod
      fallbackSubmissionPeriod
      permissionedERC721Token
      capacity
      expiryTime
      challenges {
        challengedBy
        proposedFinalReferenceValue
      }
    }
  }
`

export const fetchPoolLists = async (page: number, pageSize: number, createdBy: string, graphUrl: string) => {
	const result = await request(
		graphUrl,
		queryPools(
			(Math.max(page - 1, 0) * pageSize) / 2, // Because there are 2 rows (long and short) in the table for every pool
			pageSize / 2, // Because there are 2 rows (long and short) in the table for every pool
			createdBy,
			undefined,
		),
	);

	return result.pools;
};
