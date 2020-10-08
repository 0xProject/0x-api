import { FilterKind, MeshGraphQLClient, OrderWithMetadata } from '@0x/mesh-graphql-client';

export class MeshClient extends MeshGraphQLClient {
    constructor(public readonly webSocketUrl: string, public readonly httpUrl?: string) {
        super({
            webSocketUrl: `${webSocketUrl}/graphql`,
            httpUrl: httpUrl ? `${httpUrl}/graphql` : undefined,
        });
    }

    public async getOrdersAsync(perPage: number = 200): Promise<{ ordersInfos: OrderWithMetadata[] }> {
        let orders: OrderWithMetadata[] = [];
        let lastOrderHash: string | undefined;
        do {
            const currentOrders = await this.findOrdersAsync({
                limit: perPage,
                filters: lastOrderHash
                    ? [
                          {
                              field: 'hash',
                              kind: FilterKind.Greater,
                              value: lastOrderHash,
                          },
                      ]
                    : undefined,
            });

            // Mesh will return an empty array when we have iterated through all orders
            lastOrderHash = currentOrders.length === 0 ? undefined : currentOrders[currentOrders.length - 1]?.hash;
            orders = [...orders, ...currentOrders];
        } while (lastOrderHash !== undefined);

        return { ordersInfos: orders };
    }
}
