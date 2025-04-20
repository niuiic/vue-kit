# Dataset

管理数据集。

## DatasetService

### 依赖

```typescript
export class DatasetService<
  T extends Dataset = Dataset,
  QueryDataset extends () => Promise<T> = () => Promise<T>,
  Fallback extends (() => Promise<T> | T) | T = (() => Promise<T> | T) | T,
  GetDeps extends () => unknown = () => unknown,
> {
  constructor(
    @inject("queryDataset") queryDataset: QueryDataset,
    @optional() @inject("fallback") fallback?: Fallback,
    @optional() @inject("getDeps") getDeps?: GetDeps,
  ) {
    this.setupQueryFn(queryDataset, fallback, getDeps);
  }
}
```

### 示例

```typescript
const deps = ref({ pageNum: 1, pageSize: 10 });
// 当deps变化时，延迟更新数据，防抖。
const dataset = new DatasetService(queryDataset, fallback, () => deps.value);
assert(dataset.loading);
await dataset.loaded;
// data和loading为响应式数据。
assert(!dataset.loading);
console.log(dataset.data);
```
