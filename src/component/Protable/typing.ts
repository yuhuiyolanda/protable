import type { SpinProps, TableProps } from 'antd';

type SearchConfig = {
     /**
   * @name 文字标签的宽度
   *
   * @example 文字标签宽 80 ，一般用于只有两个字
   * labelWidth={80}
   * @example 文字标签宽 140 ，一般用于有四个字
   * labelWidth={140}
   * @example 自动计算，会导致不整齐
   * labelWidth="auto"
   */
  labelWidth?: number | 'auto';
}
/** ProTable 的类型定义 继承自 antd 的 Table */
export type ProTableProps<DataSource, U, ValueType = 'text'> = {
    /**
     * @name 列配置能力，支持一个数组
     */
    // columns?: ProColumns<DataSource, ValueType>[];
  
    /**
     * request 的参数，修改之后会触发更新
     *
     * @example pathname 修改重新触发 request
     * params={{ pathName }}
     */
    params?: U;
  
    // /** @name 一个获得 dataSource 的方法 */
    // request?: (
    //   params: U & {
    //     pageSize?: number;
    //     current?: number;
    //     keyword?: string;
    //   },
    // //   sort: Record<string, SortOrder>,
    //   filter: Record<string, (string | number)[] | null>,
    // ) => Promise<Partial<RequestData<DataSource>>>;
  
    /**
     * @name 初始化的参数，可以操作 table
     *
     * @example 重新刷新表格
     * actionRef.current?.reload();
     *
     * @example 重置表格
     * actionRef.current?.reset();
     */
    // actionRef?: React.Ref<ActionType | undefined>;

    /**
     * @name 渲染操作栏
     */
    // toolBarRender?: ToolBarProps<DataSource>['toolBarRender'] | false;

    /** @name 左上角的 title */
    headerTitle?: React.ReactNode;
  
    /** @name 操作栏配置 */
    // options?: OptionConfig | false;
  
    /**
     * @type SearchConfig
     * @name 是否显示搜索表单
     */
    search?: false | SearchConfig;

  } & Omit<TableProps<DataSource>, 'columns' | 'rowSelection'>;
  