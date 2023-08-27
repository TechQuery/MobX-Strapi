import { Constructor } from 'web-utility';
import { observable, action } from 'mobx';
import * as MobX from 'mobx';
import {
    IDType,
    DataObject,
    NewData,
    InvalidMessage,
    RESTClient,
    toggle
} from './utility';

export abstract class BaseModel {
    constructor() {
        MobX.makeObservable?.(this);
    }

    @observable
    downloading = 0;

    @observable
    uploading = 0;

    @action
    clear() {
        this.downloading = this.uploading = 0;
    }
}

/**
 * This basic class is a middle class, which isn't for direct using
 */
export abstract class BaseListModel<D extends DataObject> extends BaseModel {
    constructor() {
        super();
        MobX.makeObservable?.(this);
    }

    abstract client: RESTClient;
    abstract baseURI: string;
    indexKey: keyof D = 'id';

    @observable
    currentOne = {} as D;

    @observable
    validity: InvalidMessage<D> = {};

    static createNested(parentId: IDType) {
        const Model = this as unknown as Constructor<BaseListModel<{}>>;

        const store = new Model();

        store.baseURI = store.baseURI.replace(/:\w+/, parentId + '');

        return store;
    }

    @action
    clearCurrent() {
        this.currentOne = {} as D;
        this.validity = {};
    }

    clear() {
        super.clear();
        this.clearCurrent();
    }

    @toggle('uploading')
    async updateOne(data: Partial<NewData<D>>, id?: IDType) {
        const { body } = await (id
            ? this.client.patch<D>(`${this.baseURI}/${id}`, data)
            : this.client.post<D>(this.baseURI, data));

        return (this.currentOne = body);
    }

    @toggle('downloading')
    async getOne(id: IDType) {
        const { body } = await this.client.get<D>(`${this.baseURI}/${id}`);

        return (this.currentOne = body);
    }

    @toggle('uploading')
    async deleteOne(id: IDType) {
        await this.client.delete(`${this.baseURI}/${id}`);

        if (this.currentOne[this.indexKey] === id) this.clearCurrent();
    }
}
