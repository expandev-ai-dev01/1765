/**
 * Database Migration
 * Generated: 2025-11-18T00:07:10.581Z
 * Timestamp: 20251118_000710
 *
 * This migration includes:
 * - Schema structures (tables, indexes, constraints)
 * - Initial data
 * - Stored procedures
 *
 * Note: This file is automatically executed by the migration runner
 * on application startup in Azure App Service.
 */

-- Set options for better SQL Server compatibility
SET ANSI_NULLS ON;
SET QUOTED_IDENTIFIER ON;
SET ANSI_PADDING ON;
SET CONCAT_NULL_YIELDS_NULL ON;
SET ANSI_WARNINGS ON;
SET NUMERIC_ROUNDABORT OFF;
GO

PRINT 'Starting database migration...';
PRINT 'Timestamp: 20251118_000710';
GO


-- ============================================
-- STORED PROCEDURES
-- Database stored procedures and functions
-- ============================================

-- File: 001_create_schema.sql
/**
 * @schema functional
 * Business logic schema for StockBox inventory management
 */
CREATE SCHEMA [functional];
GO

/**
 * @table movimentacao Stock movement transaction record
 * @multitenancy true
 * @softDelete false
 * @alias mov
 */
CREATE TABLE [functional].[movimentacao] (
  [idMovimentacao] INTEGER IDENTITY(1, 1) NOT NULL,
  [idAccount] INTEGER NOT NULL,
  [idProduto] INTEGER NOT NULL,
  [idUsuario] INTEGER NOT NULL,
  [tipoAcao] INTEGER NOT NULL,
  [quantidade] NUMERIC(15, 2) NOT NULL,
  [quantidadeAnterior] NUMERIC(15, 2) NULL,
  [quantidadeNova] NUMERIC(15, 2) NULL,
  [descricao] NVARCHAR(500) NULL,
  [referenciaOrigem] NVARCHAR(100) NULL,
  [motivoSaida] NVARCHAR(100) NULL,
  [timestamp] DATETIME2 NOT NULL DEFAULT GETUTCDATE(),
  [estornada] BIT NOT NULL DEFAULT (0),
  [idMovimentacaoEstorno] INTEGER NULL
);
GO

/**
 * @table produto Product master data
 * @multitenancy true
 * @softDelete true
 * @alias prd
 */
CREATE TABLE [functional].[produto] (
  [idProduto] INTEGER IDENTITY(1, 1) NOT NULL,
  [idAccount] INTEGER NOT NULL,
  [nome] NVARCHAR(200) NOT NULL,
  [descricao] NVARCHAR(500) NOT NULL DEFAULT (''),
  [nivelMinimo] NUMERIC(15, 2) NOT NULL DEFAULT (0),
  [dateCreated] DATETIME2 NOT NULL DEFAULT GETUTCDATE(),
  [dateModified] DATETIME2 NOT NULL DEFAULT GETUTCDATE(),
  [deleted] BIT NOT NULL DEFAULT (0)
);
GO

/**
 * @primaryKey pkMovimentacao
 * @keyType Object
 */
ALTER TABLE [functional].[movimentacao]
ADD CONSTRAINT [pkMovimentacao] PRIMARY KEY CLUSTERED ([idMovimentacao]);
GO

/**
 * @primaryKey pkProduto
 * @keyType Object
 */
ALTER TABLE [functional].[produto]
ADD CONSTRAINT [pkProduto] PRIMARY KEY CLUSTERED ([idProduto]);
GO

/**
 * @foreignKey fkMovimentacao_Produto Relates movement to product
 * @target functional.produto
 */
ALTER TABLE [functional].[movimentacao]
ADD CONSTRAINT [fkMovimentacao_Produto] FOREIGN KEY ([idProduto])
REFERENCES [functional].[produto]([idProduto]);
GO

/**
 * @foreignKey fkMovimentacao_MovimentacaoEstorno Relates reversal to original movement
 * @target functional.movimentacao
 */
ALTER TABLE [functional].[movimentacao]
ADD CONSTRAINT [fkMovimentacao_MovimentacaoEstorno] FOREIGN KEY ([idMovimentacaoEstorno])
REFERENCES [functional].[movimentacao]([idMovimentacao]);
GO

/**
 * @check chkMovimentacao_TipoAcao Validates movement action type
 * @enum {0} ADICAO_PRODUTO - New product addition
 * @enum {1} ALTERACAO_QUANTIDADE - Quantity adjustment
 * @enum {2} ENTRADA - Stock entry
 * @enum {3} SAIDA - Stock exit
 * @enum {4} EXCLUSAO - Product deletion
 */
ALTER TABLE [functional].[movimentacao]
ADD CONSTRAINT [chkMovimentacao_TipoAcao] CHECK ([tipoAcao] BETWEEN 0 AND 4);
GO

/**
 * @check chkMovimentacao_Estornada Validates reversal flag
 * @enum {0} Not reversed
 * @enum {1} Reversed
 */
ALTER TABLE [functional].[movimentacao]
ADD CONSTRAINT [chkMovimentacao_Estornada] CHECK ([estornada] IN (0, 1));
GO

/**
 * @index ixMovimentacao_Account Account isolation index
 * @type ForeignKey
 */
CREATE NONCLUSTERED INDEX [ixMovimentacao_Account]
ON [functional].[movimentacao]([idAccount]);
GO

/**
 * @index ixMovimentacao_Account_Produto Movement lookup by product
 * @type ForeignKey
 */
CREATE NONCLUSTERED INDEX [ixMovimentacao_Account_Produto]
ON [functional].[movimentacao]([idAccount], [idProduto])
INCLUDE ([timestamp], [tipoAcao], [quantidade]);
GO

/**
 * @index ixMovimentacao_Account_Timestamp Movement chronological ordering
 * @type Performance
 */
CREATE NONCLUSTERED INDEX [ixMovimentacao_Account_Timestamp]
ON [functional].[movimentacao]([idAccount], [timestamp] DESC)
INCLUDE ([idProduto], [tipoAcao], [quantidade]);
GO

/**
 * @index ixMovimentacao_Account_TipoAcao Movement filtering by action type
 * @type Search
 */
CREATE NONCLUSTERED INDEX [ixMovimentacao_Account_TipoAcao]
ON [functional].[movimentacao]([idAccount], [tipoAcao])
INCLUDE ([timestamp], [idProduto], [quantidade]);
GO

/**
 * @index ixMovimentacao_Account_Usuario Movement filtering by user
 * @type Search
 */
CREATE NONCLUSTERED INDEX [ixMovimentacao_Account_Usuario]
ON [functional].[movimentacao]([idAccount], [idUsuario])
INCLUDE ([timestamp], [idProduto], [tipoAcao]);
GO

/**
 * @index ixProduto_Account Account isolation index
 * @type ForeignKey
 * @filter Active products only
 */
CREATE NONCLUSTERED INDEX [ixProduto_Account]
ON [functional].[produto]([idAccount])
WHERE [deleted] = 0;
GO

/**
 * @index ixProduto_Account_Nome Product search by name
 * @type Search
 * @filter Active products only
 */
CREATE NONCLUSTERED INDEX [ixProduto_Account_Nome]
ON [functional].[produto]([idAccount], [nome])
INCLUDE ([descricao], [nivelMinimo])
WHERE [deleted] = 0;
GO

/**
 * @index uqProduto_Account_Nome Unique product name per account
 * @type Search
 * @unique true
 * @filter Active products only
 */
CREATE UNIQUE NONCLUSTERED INDEX [uqProduto_Account_Nome]
ON [functional].[produto]([idAccount], [nome])
WHERE [deleted] = 0;
GO

-- File: 002_stored_procedures.sql
/**
 * @summary
 * Creates a new stock movement record with automatic quantity calculation
 * and validation of business rules
 *
 * @procedure spMovimentacaoCreate
 * @schema functional
 * @type stored-procedure
 *
 * @endpoints
 * - POST /api/v1/internal/movimentacao
 *
 * @parameters
 * @param {INT} idAccount
 *   - Required: Yes
 *   - Description: Account identifier
 *
 * @param {INT} idUsuario
 *   - Required: Yes
 *   - Description: User performing the movement
 *
 * @param {INT} idProduto
 *   - Required: Yes
 *   - Description: Product identifier
 *
 * @param {INT} tipoAcao
 *   - Required: Yes
 *   - Description: Movement type (0-4)
 *
 * @param {NUMERIC} quantidade
 *   - Required: Yes
 *   - Description: Quantity moved (positive for entry, negative for exit)
 *
 * @param {NVARCHAR} descricao
 *   - Required: No
 *   - Description: Movement description
 *
 * @param {NVARCHAR} referenciaOrigem
 *   - Required: Conditional (required for ENTRADA)
 *   - Description: Entry reference (invoice, supplier, etc.)
 *
 * @param {NVARCHAR} motivoSaida
 *   - Required: Conditional (required for SAIDA)
 *   - Description: Exit reason (sale, loss, etc.)
 *
 * @returns {INT} idMovimentacao - Created movement identifier
 *
 * @testScenarios
 * - Valid entry movement with positive quantity
 * - Valid exit movement with negative quantity
 * - Validation failure for insufficient stock
 * - Validation failure for missing required fields
 * - Product existence validation
 */
CREATE OR ALTER PROCEDURE [functional].[spMovimentacaoCreate]
  @idAccount INTEGER,
  @idUsuario INTEGER,
  @idProduto INTEGER,
  @tipoAcao INTEGER,
  @quantidade NUMERIC(15, 2),
  @descricao NVARCHAR(500) = NULL,
  @referenciaOrigem NVARCHAR(100) = NULL,
  @motivoSaida NVARCHAR(100) = NULL
AS
BEGIN
  SET NOCOUNT ON;

  DECLARE @quantidadeAnterior NUMERIC(15, 2);
  DECLARE @quantidadeNova NUMERIC(15, 2);
  DECLARE @idMovimentacao INTEGER;

  BEGIN TRY
    /**
     * @validation Account identifier required
     * @throw {idAccountRequired}
     */
    IF (@idAccount IS NULL)
    BEGIN
      ;THROW 51000, 'idAccountRequired', 1;
    END;

    /**
     * @validation User identifier required
     * @throw {idUsuarioRequired}
     */
    IF (@idUsuario IS NULL)
    BEGIN
      ;THROW 51000, 'idUsuarioRequired', 1;
    END;

    /**
     * @validation Product identifier required
     * @throw {idProdutoRequired}
     */
    IF (@idProduto IS NULL)
    BEGIN
      ;THROW 51000, 'idProdutoRequired', 1;
    END;

    /**
     * @validation Movement type required
     * @throw {tipoAcaoRequired}
     */
    IF (@tipoAcao IS NULL)
    BEGIN
      ;THROW 51000, 'tipoAcaoRequired', 1;
    END;

    /**
     * @validation Quantity required
     * @throw {quantidadeRequired}
     */
    IF (@quantidade IS NULL)
    BEGIN
      ;THROW 51000, 'quantidadeRequired', 1;
    END;

    /**
     * @validation Product must exist and be active
     * @throw {produtoDoesntExist}
     */
    IF NOT EXISTS (
      SELECT *
      FROM [functional].[produto] [prd]
      WHERE [prd].[idProduto] = @idProduto
        AND [prd].[idAccount] = @idAccount
        AND [prd].[deleted] = 0
    )
    BEGIN
      ;THROW 51000, 'produtoDoesntExist', 1;
    END;

    /**
     * @validation Entry reference required for ENTRADA movements
     * @throw {referenciaOrigemRequired}
     */
    IF (@tipoAcao = 2 AND (@referenciaOrigem IS NULL OR LEN(@referenciaOrigem) = 0))
    BEGIN
      ;THROW 51000, 'referenciaOrigemRequired', 1;
    END;

    /**
     * @validation Exit reason required for SAIDA movements
     * @throw {motivoSaidaRequired}
     */
    IF (@tipoAcao = 3 AND (@motivoSaida IS NULL OR LEN(@motivoSaida) = 0))
    BEGIN
      ;THROW 51000, 'motivoSaidaRequired', 1;
    END;

    BEGIN TRAN;

      /**
       * @rule {fn-stock-calculation} Calculate current stock from movement history
       */
      SELECT @quantidadeAnterior = ISNULL(SUM([mov].[quantidade]), 0)
      FROM [functional].[movimentacao] [mov]
      WHERE [mov].[idAccount] = @idAccount
        AND [mov].[idProduto] = @idProduto
        AND [mov].[estornada] = 0;

      SET @quantidadeNova = @quantidadeAnterior + @quantidade;

      /**
       * @validation Exit cannot result in negative stock
       * @throw {estoqueInsuficiente}
       */
      IF (@quantidadeNova < 0)
      BEGIN
        ;THROW 51000, 'estoqueInsuficiente', 1;
      END;

      /**
       * @rule {fn-movement-registration} Register movement with calculated quantities
       */
      INSERT INTO [functional].[movimentacao] (
        [idAccount],
        [idProduto],
        [idUsuario],
        [tipoAcao],
        [quantidade],
        [quantidadeAnterior],
        [quantidadeNova],
        [descricao],
        [referenciaOrigem],
        [motivoSaida]
      )
      VALUES (
        @idAccount,
        @idProduto,
        @idUsuario,
        @tipoAcao,
        @quantidade,
        @quantidadeAnterior,
        @quantidadeNova,
        @descricao,
        @referenciaOrigem,
        @motivoSaida
      );

      SET @idMovimentacao = SCOPE_IDENTITY();

      /**
       * @output {MovimentacaoCreated, 1, 1}
       * @column {INT} idMovimentacao
       * - Description: Created movement identifier
       */
      SELECT @idMovimentacao AS [idMovimentacao];

    COMMIT TRAN;
  END TRY
  BEGIN CATCH
    ROLLBACK TRAN;
    THROW;
  END CATCH;
END;
GO

/**
 * @summary
 * Retrieves stock movement history with optional filtering
 *
 * @procedure spMovimentacaoList
 * @schema functional
 * @type stored-procedure
 *
 * @endpoints
 * - GET /api/v1/internal/movimentacao
 *
 * @parameters
 * @param {INT} idAccount
 *   - Required: Yes
 *   - Description: Account identifier
 *
 * @param {INT} idProduto
 *   - Required: No
 *   - Description: Filter by product
 *
 * @param {INT} tipoAcao
 *   - Required: No
 *   - Description: Filter by movement type
 *
 * @param {INT} idUsuario
 *   - Required: No
 *   - Description: Filter by user
 *
 * @param {DATE} dataInicio
 *   - Required: No
 *   - Description: Start date filter
 *
 * @param {DATE} dataFim
 *   - Required: No
 *   - Description: End date filter
 *
 * @param {INT} limite
 *   - Required: No
 *   - Description: Result limit (default 100, max 1000)
 *
 * @testScenarios
 * - List all movements for account
 * - Filter by product
 * - Filter by date range
 * - Filter by movement type
 * - Pagination with limit
 */
CREATE OR ALTER PROCEDURE [functional].[spMovimentacaoList]
  @idAccount INTEGER,
  @idProduto INTEGER = NULL,
  @tipoAcao INTEGER = NULL,
  @idUsuario INTEGER = NULL,
  @dataInicio DATE = NULL,
  @dataFim DATE = NULL,
  @limite INTEGER = 100
AS
BEGIN
  SET NOCOUNT ON;

  /**
   * @validation Account identifier required
   * @throw {idAccountRequired}
   */
  IF (@idAccount IS NULL)
  BEGIN
    ;THROW 51000, 'idAccountRequired', 1;
  END;

  /**
   * @validation Limit must be between 1 and 1000
   * @throw {limiteInvalido}
   */
  IF (@limite < 1 OR @limite > 1000)
  BEGIN
    ;THROW 51000, 'limiteInvalido', 1;
  END;

  /**
   * @validation End date must be after start date
   * @throw {dataFimAnteriorDataInicio}
   */
  IF (@dataInicio IS NOT NULL AND @dataFim IS NOT NULL AND @dataFim < @dataInicio)
  BEGIN
    ;THROW 51000, 'dataFimAnteriorDataInicio', 1;
  END;

  /**
   * @output {MovimentacaoList, n, n}
   * @column {INT} idMovimentacao - Movement identifier
   * @column {INT} idProduto - Product identifier
   * @column {NVARCHAR} nomeProduto - Product name
   * @column {INT} idUsuario - User identifier
   * @column {INT} tipoAcao - Movement type
   * @column {NUMERIC} quantidade - Quantity moved
   * @column {NUMERIC} quantidadeAnterior - Previous quantity
   * @column {NUMERIC} quantidadeNova - New quantity
   * @column {NVARCHAR} descricao - Movement description
   * @column {NVARCHAR} referenciaOrigem - Entry reference
   * @column {NVARCHAR} motivoSaida - Exit reason
   * @column {DATETIME2} timestamp - Movement timestamp
   * @column {BIT} estornada - Reversal flag
   * @column {INT} idMovimentacaoEstorno - Reversal movement ID
   */
  SELECT TOP (@limite)
    [mov].[idMovimentacao],
    [mov].[idProduto],
    [prd].[nome] AS [nomeProduto],
    [mov].[idUsuario],
    [mov].[tipoAcao],
    [mov].[quantidade],
    [mov].[quantidadeAnterior],
    [mov].[quantidadeNova],
    [mov].[descricao],
    [mov].[referenciaOrigem],
    [mov].[motivoSaida],
    [mov].[timestamp],
    [mov].[estornada],
    [mov].[idMovimentacaoEstorno]
  FROM [functional].[movimentacao] [mov]
    JOIN [functional].[produto] [prd] ON ([prd].[idAccount] = [mov].[idAccount] AND [prd].[idProduto] = [mov].[idProduto])
  WHERE [mov].[idAccount] = @idAccount
    AND (@idProduto IS NULL OR [mov].[idProduto] = @idProduto)
    AND (@tipoAcao IS NULL OR [mov].[tipoAcao] = @tipoAcao)
    AND (@idUsuario IS NULL OR [mov].[idUsuario] = @idUsuario)
    AND (@dataInicio IS NULL OR CAST([mov].[timestamp] AS DATE) >= @dataInicio)
    AND (@dataFim IS NULL OR CAST([mov].[timestamp] AS DATE) <= @dataFim)
  ORDER BY [mov].[timestamp] DESC;
END;
GO

/**
 * @summary
 * Retrieves detailed information about a specific movement
 *
 * @procedure spMovimentacaoGet
 * @schema functional
 * @type stored-procedure
 *
 * @endpoints
 * - GET /api/v1/internal/movimentacao/:id
 *
 * @parameters
 * @param {INT} idAccount
 *   - Required: Yes
 *   - Description: Account identifier
 *
 * @param {INT} idMovimentacao
 *   - Required: Yes
 *   - Description: Movement identifier
 *
 * @testScenarios
 * - Retrieve existing movement
 * - Validation failure for non-existent movement
 */
CREATE OR ALTER PROCEDURE [functional].[spMovimentacaoGet]
  @idAccount INTEGER,
  @idMovimentacao INTEGER
AS
BEGIN
  SET NOCOUNT ON;

  /**
   * @validation Account identifier required
   * @throw {idAccountRequired}
   */
  IF (@idAccount IS NULL)
  BEGIN
    ;THROW 51000, 'idAccountRequired', 1;
  END;

  /**
   * @validation Movement identifier required
   * @throw {idMovimentacaoRequired}
   */
  IF (@idMovimentacao IS NULL)
  BEGIN
    ;THROW 51000, 'idMovimentacaoRequired', 1;
  END;

  /**
   * @validation Movement must exist
   * @throw {movimentacaoDoesntExist}
   */
  IF NOT EXISTS (
    SELECT *
    FROM [functional].[movimentacao] [mov]
    WHERE [mov].[idMovimentacao] = @idMovimentacao
      AND [mov].[idAccount] = @idAccount
  )
  BEGIN
    ;THROW 51000, 'movimentacaoDoesntExist', 1;
  END;

  /**
   * @output {MovimentacaoDetail, 1, n}
   * @column {INT} idMovimentacao - Movement identifier
   * @column {INT} idProduto - Product identifier
   * @column {NVARCHAR} nomeProduto - Product name
   * @column {INT} idUsuario - User identifier
   * @column {INT} tipoAcao - Movement type
   * @column {NUMERIC} quantidade - Quantity moved
   * @column {NUMERIC} quantidadeAnterior - Previous quantity
   * @column {NUMERIC} quantidadeNova - New quantity
   * @column {NVARCHAR} descricao - Movement description
   * @column {NVARCHAR} referenciaOrigem - Entry reference
   * @column {NVARCHAR} motivoSaida - Exit reason
   * @column {DATETIME2} timestamp - Movement timestamp
   * @column {BIT} estornada - Reversal flag
   * @column {INT} idMovimentacaoEstorno - Reversal movement ID
   */
  SELECT
    [mov].[idMovimentacao],
    [mov].[idProduto],
    [prd].[nome] AS [nomeProduto],
    [mov].[idUsuario],
    [mov].[tipoAcao],
    [mov].[quantidade],
    [mov].[quantidadeAnterior],
    [mov].[quantidadeNova],
    [mov].[descricao],
    [mov].[referenciaOrigem],
    [mov].[motivoSaida],
    [mov].[timestamp],
    [mov].[estornada],
    [mov].[idMovimentacaoEstorno]
  FROM [functional].[movimentacao] [mov]
    JOIN [functional].[produto] [prd] ON ([prd].[idAccount] = [mov].[idAccount] AND [prd].[idProduto] = [mov].[idProduto])
  WHERE [mov].[idMovimentacao] = @idMovimentacao
    AND [mov].[idAccount] = @idAccount;
END;
GO

/**
 * @summary
 * Reverses a stock movement by creating a counter-movement
 *
 * @procedure spMovimentacaoEstornar
 * @schema functional
 * @type stored-procedure
 *
 * @endpoints
 * - POST /api/v1/internal/movimentacao/:id/estornar
 *
 * @parameters
 * @param {INT} idAccount
 *   - Required: Yes
 *   - Description: Account identifier
 *
 * @param {INT} idUsuario
 *   - Required: Yes
 *   - Description: User performing the reversal
 *
 * @param {INT} idMovimentacaoOriginal
 *   - Required: Yes
 *   - Description: Original movement to reverse
 *
 * @param {NVARCHAR} motivoEstorno
 *   - Required: Yes
 *   - Description: Reversal justification (min 10 chars)
 *
 * @returns {INT} idMovimentacaoEstorno - Created reversal movement identifier
 *
 * @testScenarios
 * - Valid reversal of entry movement
 * - Valid reversal of exit movement
 * - Validation failure for already reversed movement
 * - Validation failure for insufficient stock
 * - Validation failure for short reversal reason
 */
CREATE OR ALTER PROCEDURE [functional].[spMovimentacaoEstornar]
  @idAccount INTEGER,
  @idUsuario INTEGER,
  @idMovimentacaoOriginal INTEGER,
  @motivoEstorno NVARCHAR(500)
AS
BEGIN
  SET NOCOUNT ON;

  DECLARE @idProduto INTEGER;
  DECLARE @tipoAcaoOriginal INTEGER;
  DECLARE @quantidadeOriginal NUMERIC(15, 2);
  DECLARE @quantidadeEstorno NUMERIC(15, 2);
  DECLARE @quantidadeAtual NUMERIC(15, 2);
  DECLARE @idMovimentacaoEstorno INTEGER;

  BEGIN TRY
    /**
     * @validation Account identifier required
     * @throw {idAccountRequired}
     */
    IF (@idAccount IS NULL)
    BEGIN
      ;THROW 51000, 'idAccountRequired', 1;
    END;

    /**
     * @validation User identifier required
     * @throw {idUsuarioRequired}
     */
    IF (@idUsuario IS NULL)
    BEGIN
      ;THROW 51000, 'idUsuarioRequired', 1;
    END;

    /**
     * @validation Original movement identifier required
     * @throw {idMovimentacaoOriginalRequired}
     */
    IF (@idMovimentacaoOriginal IS NULL)
    BEGIN
      ;THROW 51000, 'idMovimentacaoOriginalRequired', 1;
    END;

    /**
     * @validation Reversal reason required with minimum length
     * @throw {motivoEstornoInsuficiente}
     */
    IF (@motivoEstorno IS NULL OR LEN(@motivoEstorno) < 10)
    BEGIN
      ;THROW 51000, 'motivoEstornoInsuficiente', 1;
    END;

    /**
     * @validation Original movement must exist
     * @throw {movimentacaoDoesntExist}
     */
    IF NOT EXISTS (
      SELECT *
      FROM [functional].[movimentacao] [mov]
      WHERE [mov].[idMovimentacao] = @idMovimentacaoOriginal
        AND [mov].[idAccount] = @idAccount
    )
    BEGIN
      ;THROW 51000, 'movimentacaoDoesntExist', 1;
    END;

    /**
     * @validation Movement must not be already reversed
     * @throw {movimentacaoJaEstornada}
     */
    IF EXISTS (
      SELECT *
      FROM [functional].[movimentacao] [mov]
      WHERE [mov].[idMovimentacao] = @idMovimentacaoOriginal
        AND [mov].[idAccount] = @idAccount
        AND [mov].[estornada] = 1
    )
    BEGIN
      ;THROW 51000, 'movimentacaoJaEstornada', 1;
    END;

    BEGIN TRAN;

      /**
       * @rule {fn-reversal-data-retrieval} Get original movement data
       */
      SELECT
        @idProduto = [mov].[idProduto],
        @tipoAcaoOriginal = [mov].[tipoAcao],
        @quantidadeOriginal = [mov].[quantidade]
      FROM [functional].[movimentacao] [mov]
      WHERE [mov].[idMovimentacao] = @idMovimentacaoOriginal
        AND [mov].[idAccount] = @idAccount;

      SET @quantidadeEstorno = -@quantidadeOriginal;

      /**
       * @rule {fn-stock-calculation} Calculate current stock
       */
      SELECT @quantidadeAtual = ISNULL(SUM([mov].[quantidade]), 0)
      FROM [functional].[movimentacao] [mov]
      WHERE [mov].[idAccount] = @idAccount
        AND [mov].[idProduto] = @idProduto
        AND [mov].[estornada] = 0;

      /**
       * @validation Reversal cannot result in negative stock
       * @throw {estornoResultariaEstoqueNegativo}
       */
      IF (@quantidadeAtual + @quantidadeEstorno < 0)
      BEGIN
        ;THROW 51000, 'estornoResultariaEstoqueNegativo', 1;
      END;

      /**
       * @rule {fn-reversal-movement-creation} Create counter-movement
       */
      INSERT INTO [functional].[movimentacao] (
        [idAccount],
        [idProduto],
        [idUsuario],
        [tipoAcao],
        [quantidade],
        [quantidadeAnterior],
        [quantidadeNova],
        [descricao],
        [idMovimentacaoEstorno]
      )
      VALUES (
        @idAccount,
        @idProduto,
        @idUsuario,
        @tipoAcaoOriginal,
        @quantidadeEstorno,
        @quantidadeAtual,
        @quantidadeAtual + @quantidadeEstorno,
        @motivoEstorno,
        @idMovimentacaoOriginal
      );

      SET @idMovimentacaoEstorno = SCOPE_IDENTITY();

      /**
       * @rule {fn-original-movement-marking} Mark original movement as reversed
       */
      UPDATE [functional].[movimentacao]
      SET [estornada] = 1,
          [idMovimentacaoEstorno] = @idMovimentacaoEstorno
      WHERE [idMovimentacao] = @idMovimentacaoOriginal
        AND [idAccount] = @idAccount;

      /**
       * @output {MovimentacaoEstornada, 1, 1}
       * @column {INT} idMovimentacaoEstorno
       * - Description: Created reversal movement identifier
       */
      SELECT @idMovimentacaoEstorno AS [idMovimentacaoEstorno];

    COMMIT TRAN;
  END TRY
  BEGIN CATCH
    ROLLBACK TRAN;
    THROW;
  END CATCH;
END;
GO

/**
 * @summary
 * Calculates current stock status for a product
 *
 * @procedure spEstoqueAtualGet
 * @schema functional
 * @type stored-procedure
 *
 * @endpoints
 * - GET /api/v1/internal/estoque/:idProduto
 *
 * @parameters
 * @param {INT} idAccount
 *   - Required: Yes
 *   - Description: Account identifier
 *
 * @param {INT} idProduto
 *   - Required: Yes
 *   - Description: Product identifier
 *
 * @testScenarios
 * - Calculate stock for product with movements
 * - Calculate stock for product without movements
 * - Determine correct status based on quantity
 */
CREATE OR ALTER PROCEDURE [functional].[spEstoqueAtualGet]
  @idAccount INTEGER,
  @idProduto INTEGER
AS
BEGIN
  SET NOCOUNT ON;

  DECLARE @quantidadeAtual NUMERIC(15, 2);
  DECLARE @ultimaMovimentacao DATETIME2;
  DECLARE @status INTEGER;
  DECLARE @nivelMinimo NUMERIC(15, 2);
  DECLARE @deleted BIT;

  /**
   * @validation Account identifier required
   * @throw {idAccountRequired}
   */
  IF (@idAccount IS NULL)
  BEGIN
    ;THROW 51000, 'idAccountRequired', 1;
  END;

  /**
   * @validation Product identifier required
   * @throw {idProdutoRequired}
   */
  IF (@idProduto IS NULL)
  BEGIN
    ;THROW 51000, 'idProdutoRequired', 1;
  END;

  /**
   * @validation Product must exist
   * @throw {produtoDoesntExist}
   */
  IF NOT EXISTS (
    SELECT *
    FROM [functional].[produto] [prd]
    WHERE [prd].[idProduto] = @idProduto
      AND [prd].[idAccount] = @idAccount
  )
  BEGIN
    ;THROW 51000, 'produtoDoesntExist', 1;
  END;

  /**
   * @rule {fn-product-data-retrieval} Get product configuration
   */
  SELECT
    @nivelMinimo = [prd].[nivelMinimo],
    @deleted = [prd].[deleted]
  FROM [functional].[produto] [prd]
  WHERE [prd].[idProduto] = @idProduto
    AND [prd].[idAccount] = @idAccount;

  /**
   * @rule {fn-stock-calculation} Calculate current stock from movements
   */
  SELECT
    @quantidadeAtual = ISNULL(SUM([mov].[quantidade]), 0),
    @ultimaMovimentacao = MAX([mov].[timestamp])
  FROM [functional].[movimentacao] [mov]
  WHERE [mov].[idAccount] = @idAccount
    AND [mov].[idProduto] = @idProduto
    AND [mov].[estornada] = 0;

  /**
   * @rule {fn-status-determination} Determine stock status
   * Status values:
   * 0 - DISPONIVEL (available)
   * 1 - BAIXO (low stock)
   * 2 - ESGOTADO (out of stock)
   * 3 - EXCLUIDO (deleted)
   */
  IF (@deleted = 1)
  BEGIN
    SET @status = 3;
  END
  ELSE IF (@quantidadeAtual = 0)
  BEGIN
    SET @status = 2;
  END
  ELSE IF (@quantidadeAtual < @nivelMinimo)
  BEGIN
    SET @status = 1;
  END
  ELSE
  BEGIN
    SET @status = 0;
  END;

  /**
   * @output {EstoqueAtual, 1, n}
   * @column {INT} idProduto - Product identifier
   * @column {NUMERIC} quantidadeAtual - Current stock quantity
   * @column {DATETIME2} ultimaMovimentacao - Last movement timestamp
   * @column {INT} status - Stock status (0-3)
   * @column {NUMERIC} nivelMinimo - Minimum stock level
   */
  SELECT
    @idProduto AS [idProduto],
    @quantidadeAtual AS [quantidadeAtual],
    @ultimaMovimentacao AS [ultimaMovimentacao],
    @status AS [status],
    @nivelMinimo AS [nivelMinimo];
END;
GO


-- ============================================
-- Migration completed successfully
-- ============================================

PRINT 'Migration completed successfully!';
GO
