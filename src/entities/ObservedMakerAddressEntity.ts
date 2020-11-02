import { Entity, PrimaryColumn } from 'typeorm';

@Entity({ name: 'observed_maker_addresses' })
export class ObservedMakerAddressEntity {
    @PrimaryColumn({ name: 'maker_url', type: 'varchar' })
    public makerUrl: string;

    @PrimaryColumn({ name: 'maker_address', type: 'varchar' })
    public makerAddress: string;

    constructor(makerUrl: string, makerAddress: string) {
        this.makerUrl = makerUrl;
        this.makerAddress = makerAddress;
    }
}
