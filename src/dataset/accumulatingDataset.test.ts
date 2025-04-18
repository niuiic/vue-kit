import { describe, it, expect, beforeEach, vi } from 'vitest'
import { AccumulatingDatasetService } from './accumulatingDataset'

describe('AccumulatingDatasetService', () => {
  const mockQueryDataset = vi.fn()
  const mockFallback = vi.fn()

  beforeEach(() => vi.clearAllMocks())

  describe('数据累积功能', () => {
    it('应累积多次查询的数据', async () => {
      const initialData = [[1, 2]]
      const newData = [[3, 4]]

      mockQueryDataset.mockResolvedValueOnce(initialData)
      const service = new AccumulatingDatasetService(mockQueryDataset)
      await service.loaded

      mockQueryDataset.mockResolvedValueOnce(newData)
      await service['queryDataset']()

      expect(service.data).toEqual([
        [1, 2],
        [3, 4]
      ])
    })
  })

  describe('回退功能', () => {
    it('应在查询失败时使用回退数据', async () => {
      const fallbackData = [[5, 6]]

      mockQueryDataset.mockRejectedValueOnce(new Error('Failed'))
      mockFallback.mockResolvedValueOnce(fallbackData)

      const service = new AccumulatingDatasetService(
        mockQueryDataset,
        mockFallback
      )

      await service.loaded
      expect(service.data).toEqual(fallbackData)
    })

    it('不应累积回退数据', async () => {
      const initialData = [[1, 2]]
      const fallbackData = [[5, 6]]

      mockQueryDataset.mockResolvedValueOnce(initialData)
      mockQueryDataset.mockRejectedValueOnce(new Error('Failed'))
      mockFallback.mockResolvedValueOnce(fallbackData)

      const service = new AccumulatingDatasetService(
        mockQueryDataset,
        mockFallback
      )

      await service['queryDataset']()
      expect(service.data).toEqual(fallbackData)
    })
  })
})
