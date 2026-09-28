
CREATE TABLE [Roles] (
	[Id] INTEGER NOT NULL IDENTITY,
	[RoleName] NVARCHAR(50) NOT NULL UNIQUE,
	[Description] NVARCHAR(200),
	PRIMARY KEY([Id])
);
GO

CREATE TABLE [Users] (
	[Id] INTEGER NOT NULL IDENTITY,
	[FullName] NVARCHAR(150) NOT NULL,
	[PhoneNumber] NVARCHAR(20) NOT NULL,
	[PasswordHash] NVARCHAR(500) NOT NULL,
	[Status] INTEGER NOT NULL DEFAULT 0,
	[IsDeleted] BIT NOT NULL DEFAULT 0,
	[CreatedAt] DATETIME2 NOT NULL DEFAULT GETDATE(),
	[UpdatedAt] DATETIME2 NOT NULL DEFAULT GETDATE(),
	[Email] NVARCHAR(255) NOT NULL UNIQUE,
	[AccountType] INTEGER NOT NULL,
	PRIMARY KEY([Id])
);
GO

CREATE TABLE [PlayerProfiles] (
	[UserId] INTEGER NOT NULL,
	[AvatarUrl] NVARCHAR(500),
	[DateOfBirth] DATE,
	[Gender] INTEGER NOT NULL,
	[CreatedAt] DATETIME2 NOT NULL DEFAULT GETDATE(),
	[UpdatedAt] DATETIME2,
	PRIMARY KEY([UserId])
);
GO

CREATE TABLE [CourtOwners] (
	[UserId] INTEGER NOT NULL,
	[BusinessName] NVARCHAR(255) NOT NULL,
	[TaxCode] NVARCHAR(50),
	[CreatedAt] DATETIME2 NOT NULL DEFAULT GETDATE(),
	[UpdatedAt] DATETIME2 NOT NULL DEFAULT GETDATE(),
	[MustChangePwd] BIT NOT NULL DEFAULT 1,
	[QrImageUrl] NVARCHAR(255) NOT NULL,
	PRIMARY KEY([UserId])
);
GO

CREATE TABLE [RefreshTokens] (
	[Id] INTEGER NOT NULL IDENTITY,
	[UserId] INTEGER NOT NULL,
	[Token] NVARCHAR(500) NOT NULL,
	[ExpiresAt] DATETIME2 NOT NULL,
	[RevokedAt] DATETIME2,
	[CreatedAt] DATETIME2 NOT NULL DEFAULT GETDATE(),
	PRIMARY KEY([Id])
);
GO

CREATE TABLE [UserRoles] (
	[UserId] INTEGER NOT NULL,
	[RoleId] INTEGER NOT NULL,
	PRIMARY KEY([UserId], [RoleId])
);
GO

CREATE TABLE [ServicePackages] (
	[Id] INTEGER NOT NULL IDENTITY,
	[Name] NVARCHAR(255) NOT NULL,
	[Price] DECIMAL(18,2) NOT NULL,
	[Description] NVARCHAR(500) NOT NULL,
	[CreatedAt] DATETIME2 NOT NULL DEFAULT GETDATE(),
	[UpdatedAt] DATETIME2 NOT NULL DEFAULT GETDATE(),
	[DurationMonths] SMALLINT NOT NULL,
	PRIMARY KEY([Id])
);
GO

CREATE TABLE [CourtOwnerSubscriptions] (
	[Id] INTEGER NOT NULL IDENTITY,
	[CourtOwnerId] INTEGER NOT NULL,
	[ServicePackageId] INTEGER NOT NULL,
	[PricePaid] DECIMAL(18,2) NOT NULL,
	[StartDate] DATE NOT NULL,
	[EndDate] DATE NOT NULL,
	[CreatedAt] DATETIME2 NOT NULL DEFAULT GETDATE(),
	PRIMARY KEY([Id])
);
GO

CREATE TABLE [Branches] (
	[Id] INTEGER NOT NULL IDENTITY,
	[CourtOwnerId] INTEGER NOT NULL,
	[Name] NVARCHAR(255) NOT NULL,
    [GGMapUrl] NVARCHAR(255) NOT NULL,
    [Province] NVARCHAR(100) NOT NULL, -- Tỉnh / Thành phố (VD: "Hồ Chí Minh", "Hà Nội")
    [District] NVARCHAR(100) NOT NULL,
	[Street] NVARCHAR(255) NOT NULL,
	[Latitude] DECIMAL(9,6),
	[Longitude] DECIMAL(9,6),
	[IsActive] BIT NOT NULL DEFAULT 1,
	[CreatedAt] DATETIME2 NOT NULL DEFAULT GETDATE(),
	[UpdatedAt] DATETIME2 NOT NULL DEFAULT GETDATE(),
	[ReviewTotal] INTEGER NOT NULL DEFAULT 0,
	[SportTypeId] INTEGER NOT NULL,
	[OpenTime] TIME NOT NULL,
	[CloseTime] TIME NOT NULL,
	[Policy] NVARCHAR(255),
	[QrImageUrl] NVARCHAR(255) NOT NULL,
	[AccountNumer] NVARCHAR(255) NOT NULL,
	[AccountName] NVARCHAR(255) NOT NULL,
	PRIMARY KEY([Id])
);
GO

CREATE TABLE [SportType] (
	[Id] INTEGER NOT NULL IDENTITY,
	[Name] NVARCHAR(100) NOT NULL,
	[ImageUrl] NVARCHAR(500),
	[IsActive] BIT NOT NULL DEFAULT 1,
	PRIMARY KEY([Id])
);
GO

CREATE TABLE [CourtTypes] (
	[Id] INTEGER NOT NULL IDENTITY,
	[BranchId] INTEGER NOT NULL,
	[Name] NVARCHAR(255) NOT NULL,
	[MinutesConfig] INTEGER NOT NULL,
	PRIMARY KEY([Id])
);
GO

CREATE TABLE [Courts] (
	[Id] INTEGER NOT NULL IDENTITY,
	[CourtTyped] INTEGER NOT NULL,
	[Name] NVARCHAR(255) NOT NULL,
	[Status] TINYINT NOT NULL DEFAULT 1,
	[CreatedAt] DATETIME2 NOT NULL DEFAULT GETDATE(),
	[UpdatedAt] DATETIME2 NOT NULL DEFAULT GETDATE(),
	PRIMARY KEY([Id])
);
GO

CREATE TABLE [PriceTables] (
	[Id] INTEGER NOT NULL IDENTITY,
	[CourtTypeId] INTEGER NOT NULL,
	[Name] NVARCHAR(255) NOT NULL,
	[IsActive] BIT NOT NULL DEFAULT 1,
	[CreatedAt] DATETIME2 NOT NULL DEFAULT GETDATE(),
	[UpdatedAt] DATETIME2 NOT NULL DEFAULT GETDATE(),
	[DefaultPrice] DECIMAL(18,2) NOT NULL DEFAULT 0,
	PRIMARY KEY([Id])
);
GO

CREATE TABLE [PriceTableRules] (
	[Id] INTEGER NOT NULL IDENTITY,
	[PriceTableId] INTEGER NOT NULL,
	[StartDate] DATE,
	[EndDate] DATE,
	[DayOfWeekFrom] TINYINT NOT NULL,
	[DayOfWeekTo] TINYINT NOT NULL,
	[StartTime] TIME NOT NULL,
	[EndTime] TIME NOT NULL,
	[FixedCustomerPrice] DECIMAL(18,2) NOT NULL,
	[WalkInCustomerPrice] DECIMAL(18,2) NOT NULL,
	PRIMARY KEY([Id])
);
GO

CREATE TABLE [FixedTimeBlock] (
	[Id] INTEGER NOT NULL IDENTITY,
	[DaysOfWeekMask] INTEGER NOT NULL,
	[StartTime] TIME NOT NULL,
	[EndTime] TIME NOT NULL,
	[CreatedAt] DATETIME2 NOT NULL DEFAULT GETDATE(),
	[UpdatedAt] DATETIME2 NOT NULL DEFAULT GETDATE(),
	[CourtTypeId] INTEGER NOT NULL,
	PRIMARY KEY([Id])
);
GO

EXEC sys.sp_addextendedproperty
    @name=N'MS_Description', @value=N'Lưu theo kểu bitwise',
    @level0type=N'SCHEMA',@level0name=N'dbo',
    @level1type=N'TABLE',@level1name=N'FixedTimeBlock',
    @level2type=N'COLUMN',@level2name=N'DaysOfWeekMask';
GO

CREATE TABLE [FixedTimeBlockCourts] (
	[FixedTimeBlockId] INTEGER NOT NULL,
	[CourtId] INTEGER NOT NULL,
	PRIMARY KEY([FixedTimeBlockId], [CourtId])
);
GO

CREATE TABLE [Orders] (
	[Id] INTEGER NOT NULL IDENTITY,
	[OrderCode] NVARCHAR(255) NOT NULL,
	[BranchId] INTEGER NOT NULL,
	[PlayerId] INTEGER,
	[CustomerName] NVARCHAR(255) NOT NULL,
	[CustomerPhone] NVARCHAR(20) NOT NULL,
	[Channel] TINYINT NOT NULL,
	[TotalAmount] DECIMAL(18,2) NOT NULL,
	[Status] TINYINT NOT NULL DEFAULT 0,
	[HoldExpiresAt] DATETIME2 NOT NULL,
	[OrderDate] DATE NOT NULL,
	[CreatedAt] DATETIME2 NOT NULL DEFAULT GETDATE(),
	[UpdatedAt] DATETIME2 NOT NULL DEFAULT GETDATE(),
	[DiscountAmount] DECIMAL(18,2) NOT NULL DEFAULT 0,
	[OrderType] TINYINT NOT NULL,
	[CancelReason] NVARCHAR(255),
	[Note] NVARCHAR(255),
	PRIMARY KEY([Id])
);
GO

EXEC sys.sp_addextendedproperty
    @name=N'MS_Description', @value=N'Thêm giá trị mới: 3 = Chủ sân tạo (giao lưu)',
    @level0type=N'SCHEMA',@level0name=N'dbo',
    @level1type=N'TABLE',@level1name=N'Orders',
    @level2type=N'COLUMN',@level2name=N'Channel';
GO

EXEC sys.sp_addextendedproperty
    @name=N'MS_Description', @value=N'Thêm giá trị mới: 3 = Giao lưu (Social match)',
    @level0type=N'SCHEMA',@level0name=N'dbo',
    @level1type=N'TABLE',@level1name=N'Orders',
    @level2type=N'COLUMN',@level2name=N'OrderType';
GO

-- FIX: bỏ cột Status (hủy chỉ xử lý ở cấp Orders, không hủy riêng lẻ từng buổi)
CREATE TABLE [OrdersDetails] (
	[Id] INTEGER NOT NULL IDENTITY,
	[OrderId] INTEGER NOT NULL,
	[CourtId] INTEGER NOT NULL,
	[StartTime] TIME NOT NULL,
	[EndTime] TIME NOT NULL,
	[Price] DECIMAL(18,2) NOT NULL,
	[Date] DATE NOT NULL,
	[FixedOrderConfigCourtId] INTEGER,
	PRIMARY KEY([Id])
);
GO

CREATE TABLE [Services] (
	[Id] INTEGER NOT NULL IDENTITY,
	[CategoryId] INTEGER NOT NULL,
	[Name] NVARCHAR(255) NOT NULL,
	[Unit] NVARCHAR(50) NOT NULL,
	[ImageUrl] NVARCHAR(500),
	[CreatedAt] DATETIME2 NOT NULL DEFAULT GETDATE(),
	[UpdatedAt] DATETIME2 NOT NULL DEFAULT GETDATE(),
	PRIMARY KEY([Id])
);
GO

CREATE TABLE [OrderServices] (
	[Id] INTEGER NOT NULL IDENTITY,
	[OrderId] INTEGER NOT NULL,
	[ServiceId] INTEGER NOT NULL,
	[Quantity] INTEGER NOT NULL,
	[UnitPrice] DECIMAL(18,2) NOT NULL,
	PRIMARY KEY([Id])
);
GO

CREATE TABLE [SocialMatches] (
	[Id] INTEGER NOT NULL IDENTITY,
	[OrderId] INTEGER NOT NULL UNIQUE,
	[BranchId] INTEGER NOT NULL,
	[SportTypeId] INTEGER NOT NULL,
	[Date] DATE NOT NULL,
	[StartTime] TIME NOT NULL,
	[EndTime] TIME NOT NULL,
	[HostId] INTEGER NOT NULL,
	[SkillLevel] NVARCHAR(50),
	[MissingPlayers] INTEGER NOT NULL,
	[FeePerPlayer] DECIMAL(18,2) NOT NULL,
	[ApprovalMode] TINYINT NOT NULL DEFAULT 0,
	[Status] TINYINT NOT NULL DEFAULT 0,
	[CreatedAt] DATETIME2 NOT NULL DEFAULT GETDATE(),
	[Description] NVARCHAR(500),
	PRIMARY KEY([Id])
);
GO

EXEC sys.sp_addextendedproperty
    @name=N'MS_Description', @value=N'Denormalize để query list kèo theo chi nhánh mà không cần join Orders',
    @level0type=N'SCHEMA',@level0name=N'dbo',
    @level1type=N'TABLE',@level1name=N'SocialMatches',
    @level2type=N'COLUMN',@level2name=N'BranchId';
GO

EXEC sys.sp_addextendedproperty
    @name=N'MS_Description', @value=N'Ngày diễn ra kèo',
    @level0type=N'SCHEMA',@level0name=N'dbo',
    @level1type=N'TABLE',@level1name=N'SocialMatches',
    @level2type=N'COLUMN',@level2name=N'Date';
GO

EXEC sys.sp_addextendedproperty
    @name=N'MS_Description', @value=N'UserId người tạo kèo: có thể là Player hoặc CourtOwner - vì vậy trỏ Users.Id, KHÔNG trỏ PlayerProfiles',
    @level0type=N'SCHEMA',@level0name=N'dbo',
    @level1type=N'TABLE',@level1name=N'SocialMatches',
    @level2type=N'COLUMN',@level2name=N'HostId';
GO

EXEC sys.sp_addextendedproperty
    @name=N'MS_Description', @value=N'Tổng số chỗ cần tuyển',
    @level0type=N'SCHEMA',@level0name=N'dbo',
    @level1type=N'TABLE',@level1name=N'SocialMatches',
    @level2type=N'COLUMN',@level2name=N'MissingPlayers';
GO

EXEC sys.sp_addextendedproperty
    @name=N'MS_Description', @value=N'0: Tự động duyệt, 1: Chủ kèo duyệt tay',
    @level0type=N'SCHEMA',@level0name=N'dbo',
    @level1type=N'TABLE',@level1name=N'SocialMatches',
    @level2type=N'COLUMN',@level2name=N'ApprovalMode';
GO

EXEC sys.sp_addextendedproperty
    @name=N'MS_Description', @value=N'0: Open, 1: Full, 2: Closed, 3: Cancelled',
    @level0type=N'SCHEMA',@level0name=N'dbo',
    @level1type=N'TABLE',@level1name=N'SocialMatches',
    @level2type=N'COLUMN',@level2name=N'Status';
GO

CREATE TABLE [MatchParticipants] (
	[Id] INTEGER NOT NULL IDENTITY,
	[MatchId] INTEGER NOT NULL,
	[PlayerId] INTEGER NOT NULL,
	[Status] TINYINT NOT NULL DEFAULT 0,
	[HoldExpiresAt] DATETIME2,
	[JoinedAt] DATETIME2 NOT NULL DEFAULT GETDATE(),
	PRIMARY KEY([Id])
);
GO

EXEC sys.sp_addextendedproperty
    @name=N'MS_Description', @value=N'0: PendingApproval, 1: PendingPayment, 2: Confirmed, 3: Rejected, 4: Cancelled, 5: Expired',
    @level0type=N'SCHEMA',@level0name=N'dbo',
    @level1type=N'TABLE',@level1name=N'MatchParticipants',
    @level2type=N'COLUMN',@level2name=N'Status';
GO

EXEC sys.sp_addextendedproperty
    @name=N'MS_Description', @value=N'Hạn thanh toán để giữ chỗ, quá hạn thì tự huỷ và nhả chỗ',
    @level0type=N'SCHEMA',@level0name=N'dbo',
    @level1type=N'TABLE',@level1name=N'MatchParticipants',
    @level2type=N'COLUMN',@level2name=N'HoldExpiresAt';
GO

-- FIX: index thiếu tên
CREATE UNIQUE INDEX [UQ_MatchParticipants_MatchId_PlayerId]
ON [MatchParticipants] ([MatchId], [PlayerId]);
GO

CREATE TABLE [Reviews] (
	[Id] INTEGER NOT NULL IDENTITY,
	[OrderId] INTEGER NOT NULL UNIQUE,
	[PlayerId] INTEGER NOT NULL,
	[Rating] TINYINT NOT NULL,
	[Comment] NVARCHAR(1000),
	[ImageUrl] NVARCHAR(500),
	[CreatedAt] DATETIME2 NOT NULL DEFAULT GETDATE(),
	PRIMARY KEY([Id])
);
GO

CREATE TABLE [PaymentTransactions] (
	[Id] INTEGER NOT NULL IDENTITY,
	[OrderId] INTEGER,
	[Amount] DECIMAL(18,2) NOT NULL,
	[Type] TINYINT NOT NULL DEFAULT 1,
	[Method] TINYINT NOT NULL,
	[ProofImageUrl] NVARCHAR(500),
	[CreatedAt] DATETIME2 NOT NULL DEFAULT GETDATE(),
	PRIMARY KEY([Id])
);
GO

EXEC sys.sp_addextendedproperty
    @name=N'MS_Description', @value=N'Nullable: null nếu đây là giao dịch của người chơi tham gia kèo',
    @level0type=N'SCHEMA',@level0name=N'dbo',
    @level1type=N'TABLE',@level1name=N'PaymentTransactions',
    @level2type=N'COLUMN',@level2name=N'OrderId';
GO

EXEC sys.sp_addextendedproperty
    @name=N'MS_Description', @value=N'1: Thanh toán, 2: Hoàn tiền',
    @level0type=N'SCHEMA',@level0name=N'dbo',
    @level1type=N'TABLE',@level1name=N'PaymentTransactions',
    @level2type=N'COLUMN',@level2name=N'Type';
GO

CREATE TABLE [RetailOrderItems] (
	[Id] INTEGER NOT NULL IDENTITY,
	[RetailOrderId] INTEGER NOT NULL,
	[ServiceId] INTEGER NOT NULL,
	[Quantity] INTEGER NOT NULL,
	[UnitPrice] DECIMAL(18,2) NOT NULL,
	PRIMARY KEY([Id])
);
GO

CREATE TABLE [ServiceBranches] (
	[ServiceId] INTEGER NOT NULL,
	[BranchId] INTEGER NOT NULL,
	[IsActive] BIT NOT NULL DEFAULT 1,
	[Price] DECIMAL(18,2) NOT NULL,
	PRIMARY KEY([ServiceId], [BranchId])
);
GO

CREATE TABLE [ServiceCategories] (
	[Id] INTEGER NOT NULL IDENTITY,
	[Name] NVARCHAR(150) NOT NULL UNIQUE,
	[Description] NVARCHAR(300),
	[DisplayOrder] INTEGER NOT NULL DEFAULT 0,
	[IsActive] BIT NOT NULL DEFAULT 1,
	[CreatedAt] DATETIME2 NOT NULL DEFAULT GETDATE(),
	[UpdatedAt] DATETIME2 NOT NULL DEFAULT GETDATE(),
	PRIMARY KEY([Id])
);
GO

-- FIX: bỏ cột OderId (typo + gây vòng lặp OrderId <-> OrdersDetails)
CREATE TABLE [FixedOrderConfigs] (
	[Id] INTEGER NOT NULL IDENTITY,
	[StartDate] DATE NOT NULL,
	[EndDate] DATE NOT NULL,
	[ExceptionDates] NVARCHAR(255),
	PRIMARY KEY([Id])
);
GO

CREATE TABLE [RetailOrder] (
	[Id] INTEGER NOT NULL IDENTITY,
	[TotalAmount] DECIMAL(18,2) NOT NULL,
	[DiscountAmount] DECIMAL(18,2) NOT NULL DEFAULT 0,
	[OrderDate] DATE NOT NULL,
	[CreatedAt] DATETIME2 NOT NULL DEFAULT GETDATE(),
	[UpdatedAt] DATETIME2 NOT NULL DEFAULT GETDATE(),
	[BranchId] INTEGER NOT NULL,
	PRIMARY KEY([Id])
);
GO

CREATE TABLE [BranchImages] (
	[Id] INTEGER NOT NULL IDENTITY,
	[ImageUrl] NVARCHAR(255) NOT NULL,
	[DisplayOrder] INTEGER NOT NULL DEFAULT 0,
	[BranchId] INTEGER NOT NULL,
	PRIMARY KEY([Id])
);
GO

CREATE TABLE [EventTickets] (
	[Id] INTEGER NOT NULL IDENTITY,
	[EventId] INTEGER NOT NULL,
	[PlayerId] INTEGER NOT NULL,
	[Quantity] INTEGER NOT NULL DEFAULT 1,
	[PaymentMethod] TINYINT NOT NULL,
	[ProofImageUrl] NVARCHAR(500),
	[Status] TINYINT NOT NULL DEFAULT 0,
	[ReviewedAt] DATETIME2,
	[RefundNote] NVARCHAR(255),
	[CreatedAt] DATETIME2 NOT NULL DEFAULT GETDATE(),
	[Price] DECIMAL(18,2) NOT NULL,
	PRIMARY KEY([Id])
);
GO

EXEC sys.sp_addextendedproperty
    @name=N'MS_Description', @value=N'1=Tiền mặt, 2=Chuyển khoản QR',
    @level0type=N'SCHEMA',@level0name=N'dbo',
    @level1type=N'TABLE',@level1name=N'EventTickets',
    @level2type=N'COLUMN',@level2name=N'PaymentMethod';
GO

EXEC sys.sp_addextendedproperty
    @name=N'MS_Description', @value=N'Ảnh chụp màn hình CK - NULL nếu trả tiền mặt tại chỗ',
    @level0type=N'SCHEMA',@level0name=N'dbo',
    @level1type=N'TABLE',@level1name=N'EventTickets',
    @level2type=N'COLUMN',@level2name=N'ProofImageUrl';
GO

EXEC sys.sp_addextendedproperty
    @name=N'MS_Description', @value=N'Lý do/ghi chú hoàn tiền nếu Status=Refunded',
    @level0type=N'SCHEMA',@level0name=N'dbo',
    @level1type=N'TABLE',@level1name=N'EventTickets',
    @level2type=N'COLUMN',@level2name=N'RefundNote';
GO

-- FIX: bổ sung lại SkillLevelFrom (bị thiếu so với bản trước, chỉ còn SkillLevelTo)
CREATE TABLE [Events] (
	[Id] INTEGER NOT NULL IDENTITY,
	[OrderId] INTEGER NOT NULL UNIQUE,
	[Date] DATE NOT NULL,
	[StartTime] TIME NOT NULL,
	[EndTime] TIME NOT NULL,
	[Title] NVARCHAR(255) NOT NULL,
	[SkillLevelFrom] NVARCHAR(50),
	[SkillLevelTo] NVARCHAR(50),
	[TicketPrice] DECIMAL(18,2) NOT NULL,
	[Slots] INTEGER NOT NULL,
	[Status] TINYINT NOT NULL DEFAULT 0,
	[CreatedAt] DATETIME2 NOT NULL DEFAULT GETDATE(),
	[Description] NVARCHAR(500),
	[AvailableSlot] INTEGER NOT NULL,
	[SportTypeId] INTEGER NOT NULL,
	PRIMARY KEY([Id])
);
GO

EXEC sys.sp_addextendedproperty
    @name=N'MS_Description', @value=N'Đơn đặt sân do Chủ sân tự tạo cho sự kiện (Channel=3)',
    @level0type=N'SCHEMA',@level0name=N'dbo',
    @level1type=N'TABLE',@level1name=N'Events',
    @level2type=N'COLUMN',@level2name=N'OrderId';
GO

EXEC sys.sp_addextendedproperty
    @name=N'MS_Description', @value=N'"[Social] - Trình khá trên 6 tháng"',
    @level0type=N'SCHEMA',@level0name=N'dbo',
    @level1type=N'TABLE',@level1name=N'Events',
    @level2type=N'COLUMN',@level2name=N'Title';
GO

EXEC sys.sp_addextendedproperty
    @name=N'MS_Description', @value=N'0:Open, 1:Full, 2:Closed, 3:Cancelled',
    @level0type=N'SCHEMA',@level0name=N'dbo',
    @level1type=N'TABLE',@level1name=N'Events',
    @level2type=N'COLUMN',@level2name=N'Status';
GO

CREATE TABLE [Images] (
	[Id] INTEGER NOT NULL IDENTITY,
	[Url] NVARCHAR(500) NOT NULL,
	[StorageProvider] TINYINT NOT NULL,
	[StorageKey] NVARCHAR(255) NOT NULL,
	[Status] TINYINT NOT NULL DEFAULT 1,
	[CreatedAt] DATETIME2 NOT NULL DEFAULT GETDATE(),
	[AttachedAt] DATETIME2,
	PRIMARY KEY([Id])
);
GO

EXEC sys.sp_addextendedproperty
    @name=N'MS_Description', @value=N'1=Cloudinary, 2=S3, 3=AzureBlob',
    @level0type=N'SCHEMA',@level0name=N'dbo',
    @level1type=N'TABLE',@level1name=N'Images',
    @level2type=N'COLUMN',@level2name=N'StorageProvider';
GO

EXEC sys.sp_addextendedproperty
    @name=N'MS_Description', @value=N'public_id/object key - dùng để gọi API xoá file thật trên storage',
    @level0type=N'SCHEMA',@level0name=N'dbo',
    @level1type=N'TABLE',@level1name=N'Images',
    @level2type=N'COLUMN',@level2name=N'StorageKey';
GO

-- FIX: bỏ khoảng trắng tên bảng; chuyển IDENTITY từ FixedOrderConfigId sang đúng cột PK là Id
-- GIỮ NGUYÊN thiết kế "mỗi cặp (Config, Court) có DaysOfWeekMask/StartTime/EndTime riêng"
-- -> 1 config áp dụng nhiều sân, mỗi sân có thể khác cả giờ lẫn thứ trong tuần
CREATE TABLE [FixedOrderConfigCourts] (
	[Id] INTEGER NOT NULL IDENTITY,
	[FixedOrderConfigId] INTEGER NOT NULL,
	[CourtId] INTEGER NOT NULL,
	[DaysOfWeekMask] INTEGER NOT NULL,
	[StartTime] TIME NOT NULL,
	[EndTime] TIME NOT NULL,
	PRIMARY KEY([Id])
);
GO

/* ============================================================
   FOREIGN KEYS - đã sửa toàn bộ chiều đảo ngược
   ============================================================ */

ALTER TABLE [PlayerProfiles]
ADD FOREIGN KEY([UserId])
REFERENCES [Users]([Id])
ON UPDATE NO ACTION ON DELETE CASCADE;
GO

ALTER TABLE [CourtOwners]
ADD FOREIGN KEY([UserId])
REFERENCES [Users]([Id])
ON UPDATE NO ACTION ON DELETE CASCADE;
GO

ALTER TABLE [RefreshTokens]
ADD FOREIGN KEY([UserId])
REFERENCES [Users]([Id])
ON UPDATE NO ACTION ON DELETE CASCADE;
GO

ALTER TABLE [UserRoles]
ADD FOREIGN KEY([UserId])
REFERENCES [Users]([Id])
ON UPDATE NO ACTION ON DELETE CASCADE;
GO

ALTER TABLE [UserRoles]
ADD FOREIGN KEY([RoleId])
REFERENCES [Roles]([Id])
ON UPDATE NO ACTION ON DELETE CASCADE;
GO

ALTER TABLE [CourtOwnerSubscriptions]
ADD FOREIGN KEY([CourtOwnerId])
REFERENCES [CourtOwners]([UserId])
ON UPDATE NO ACTION ON DELETE NO ACTION;
GO

ALTER TABLE [CourtOwnerSubscriptions]
ADD FOREIGN KEY([ServicePackageId])
REFERENCES [ServicePackages]([Id])
ON UPDATE NO ACTION ON DELETE NO ACTION;
GO

ALTER TABLE [Branches]
ADD FOREIGN KEY([CourtOwnerId])
REFERENCES [CourtOwners]([UserId])
ON UPDATE NO ACTION ON DELETE NO ACTION;
GO

-- FIX (đảo chiều đúng): Branches.SportTypeId -> SportType.Id
ALTER TABLE [Branches]
ADD FOREIGN KEY([SportTypeId])
REFERENCES [SportType]([Id])
ON UPDATE NO ACTION ON DELETE NO ACTION;
GO

ALTER TABLE [PriceTableRules]
ADD FOREIGN KEY([PriceTableId])
REFERENCES [PriceTables]([Id])
ON UPDATE NO ACTION ON DELETE CASCADE;
GO

ALTER TABLE [FixedTimeBlockCourts]
ADD FOREIGN KEY([FixedTimeBlockId])
REFERENCES [FixedTimeBlock]([Id])
ON UPDATE NO ACTION ON DELETE CASCADE;
GO

ALTER TABLE [FixedTimeBlockCourts]
ADD FOREIGN KEY([CourtId])
REFERENCES [Courts]([Id])
ON UPDATE NO ACTION ON DELETE CASCADE;
GO

ALTER TABLE [Orders]
ADD FOREIGN KEY([BranchId])
REFERENCES [Branches]([Id])
ON UPDATE NO ACTION ON DELETE NO ACTION;
GO

-- FIX (thiếu hoàn toàn trước đây): Orders.PlayerId -> PlayerProfiles.UserId (không phải Users.Id)
ALTER TABLE [Orders]
ADD FOREIGN KEY([PlayerId])
REFERENCES [PlayerProfiles]([UserId])
ON UPDATE NO ACTION ON DELETE NO ACTION;
GO

ALTER TABLE [OrdersDetails]
ADD FOREIGN KEY([OrderId])
REFERENCES [Orders]([Id])
ON UPDATE NO ACTION ON DELETE CASCADE;
GO

ALTER TABLE [OrdersDetails]
ADD FOREIGN KEY([CourtId])
REFERENCES [Courts]([Id])
ON UPDATE NO ACTION ON DELETE NO ACTION;
GO

-- FIX (đảo chiều đúng): OrdersDetails.FixedOrderConfigCourtId -> FixedOrderConfigCourts.Id
ALTER TABLE [OrdersDetails]
ADD FOREIGN KEY([FixedOrderConfigCourtId])
REFERENCES [FixedOrderConfigCourts]([Id])
ON UPDATE NO ACTION ON DELETE NO ACTION;
GO

ALTER TABLE [OrderServices]
ADD FOREIGN KEY([OrderId])
REFERENCES [Orders]([Id])
ON UPDATE NO ACTION ON DELETE CASCADE;
GO

ALTER TABLE [OrderServices]
ADD FOREIGN KEY([ServiceId])
REFERENCES [Services]([Id])
ON UPDATE NO ACTION ON DELETE NO ACTION;
GO

ALTER TABLE [SocialMatches]
ADD FOREIGN KEY([OrderId])
REFERENCES [Orders]([Id])
ON UPDATE NO ACTION ON DELETE NO ACTION;
GO

ALTER TABLE [SocialMatches]
ADD FOREIGN KEY([BranchId])
REFERENCES [Branches]([Id])
ON UPDATE NO ACTION ON DELETE NO ACTION;
GO

ALTER TABLE [SocialMatches]
ADD FOREIGN KEY([SportTypeId])
REFERENCES [SportType]([Id])
ON UPDATE NO ACTION ON DELETE NO ACTION;
GO

-- FIX (thiếu hoàn toàn trước đây): SocialMatches.HostId -> Users.Id (Host có thể Player hoặc CourtOwner)
ALTER TABLE [SocialMatches]
ADD FOREIGN KEY([HostId])
REFERENCES [Users]([Id])
ON UPDATE NO ACTION ON DELETE NO ACTION;
GO

ALTER TABLE [MatchParticipants]
ADD FOREIGN KEY([MatchId])
REFERENCES [SocialMatches]([Id])
ON UPDATE NO ACTION ON DELETE CASCADE;
GO

-- FIX (đổi theo quyết định mới): MatchParticipants.PlayerId -> PlayerProfiles.UserId (không phải Users.Id)
ALTER TABLE [MatchParticipants]
ADD FOREIGN KEY([PlayerId])
REFERENCES [PlayerProfiles]([UserId])
ON UPDATE NO ACTION ON DELETE NO ACTION;
GO

ALTER TABLE [Reviews]
ADD FOREIGN KEY([OrderId])
REFERENCES [Orders]([Id])
ON UPDATE NO ACTION ON DELETE NO ACTION;
GO

-- FIX (thiếu hoàn toàn trước đây): Reviews.PlayerId -> PlayerProfiles.UserId
ALTER TABLE [Reviews]
ADD FOREIGN KEY([PlayerId])
REFERENCES [PlayerProfiles]([UserId])
ON UPDATE NO ACTION ON DELETE NO ACTION;
GO

ALTER TABLE [PaymentTransactions]
ADD FOREIGN KEY([OrderId])
REFERENCES [Orders]([Id])
ON UPDATE NO ACTION ON DELETE NO ACTION;
GO

ALTER TABLE [RetailOrderItems]
ADD FOREIGN KEY([RetailOrderId])
REFERENCES [RetailOrder]([Id])
ON UPDATE NO ACTION ON DELETE NO ACTION;
GO

-- FIX (đảo chiều đúng): RetailOrderItems.ServiceId -> Services.Id
ALTER TABLE [RetailOrderItems]
ADD FOREIGN KEY([ServiceId])
REFERENCES [Services]([Id])
ON UPDATE NO ACTION ON DELETE NO ACTION;
GO

-- FIX (đảo chiều đúng): RetailOrder.BranchId -> Branches.Id
ALTER TABLE [RetailOrder]
ADD FOREIGN KEY([BranchId])
REFERENCES [Branches]([Id])
ON UPDATE NO ACTION ON DELETE NO ACTION;
GO

ALTER TABLE [Services]
ADD FOREIGN KEY([CategoryId])
REFERENCES [ServiceCategories]([Id])
ON UPDATE NO ACTION ON DELETE NO ACTION;
GO

-- FIX (đảo chiều đúng): ServiceBranches.ServiceId -> Services.Id
ALTER TABLE [ServiceBranches]
ADD FOREIGN KEY([ServiceId])
REFERENCES [Services]([Id])
ON UPDATE NO ACTION ON DELETE NO ACTION;
GO

-- FIX (đảo chiều đúng): ServiceBranches.BranchId -> Branches.Id
ALTER TABLE [ServiceBranches]
ADD FOREIGN KEY([BranchId])
REFERENCES [Branches]([Id])
ON UPDATE NO ACTION ON DELETE NO ACTION;
GO

ALTER TABLE [Courts]
ADD FOREIGN KEY([CourtTyped])
REFERENCES [CourtTypes]([Id])
ON UPDATE NO ACTION ON DELETE NO ACTION;
GO

ALTER TABLE [CourtTypes]
ADD FOREIGN KEY([BranchId])
REFERENCES [Branches]([Id])
ON UPDATE NO ACTION ON DELETE NO ACTION;
GO

ALTER TABLE [PriceTables]
ADD FOREIGN KEY([CourtTypeId])
REFERENCES [CourtTypes]([Id])
ON UPDATE NO ACTION ON DELETE NO ACTION;
GO

ALTER TABLE [FixedTimeBlock]
ADD FOREIGN KEY([CourtTypeId])
REFERENCES [CourtTypes]([Id])
ON UPDATE NO ACTION ON DELETE NO ACTION;
GO

-- FIX (đảo chiều đúng): BranchImages.BranchId -> Branches.Id
ALTER TABLE [BranchImages]
ADD FOREIGN KEY([BranchId])
REFERENCES [Branches]([Id])
ON UPDATE NO ACTION ON DELETE CASCADE;
GO

ALTER TABLE [EventTickets]
ADD FOREIGN KEY([EventId])
REFERENCES [Events]([Id])
ON UPDATE NO ACTION ON DELETE CASCADE;
GO

-- FIX (thiếu hoàn toàn trước đây): EventTickets.PlayerId -> PlayerProfiles.UserId
ALTER TABLE [EventTickets]
ADD FOREIGN KEY([PlayerId])
REFERENCES [PlayerProfiles]([UserId])
ON UPDATE NO ACTION ON DELETE NO ACTION;
GO

-- FIX (đảo chiều đúng, quan trọng nhất): Events.OrderId -> Orders.Id
ALTER TABLE [Events]
ADD FOREIGN KEY([OrderId])
REFERENCES [Orders]([Id])
ON UPDATE NO ACTION ON DELETE CASCADE;
GO

-- FIX (đảo chiều đúng): Events.SportTypeId -> SportType.Id
ALTER TABLE [Events]
ADD FOREIGN KEY([SportTypeId])
REFERENCES [SportType]([Id])
ON UPDATE NO ACTION ON DELETE NO ACTION;
GO

ALTER TABLE [FixedOrderConfigCourts]
ADD FOREIGN KEY([FixedOrderConfigId])
REFERENCES [FixedOrderConfigs]([Id])
ON UPDATE NO ACTION ON DELETE CASCADE;
GO

ALTER TABLE [FixedOrderConfigCourts]
ADD FOREIGN KEY([CourtId])
REFERENCES [Courts]([Id])
ON UPDATE NO ACTION ON DELETE NO ACTION;
GO

/* ============================================================
   INDEXES BỔ SUNG (SQL Server không tự tạo index cho cột FK)
   ============================================================ */

CREATE INDEX [IX_OrdersDetails_OrderId] ON [OrdersDetails]([OrderId]);
GO
CREATE INDEX [IX_OrdersDetails_CourtId_Date_StartTime] ON [OrdersDetails]([CourtId], [Date], [StartTime]);
GO
CREATE INDEX [IX_OrdersDetails_FixedOrderConfigCourtId] ON [OrdersDetails]([FixedOrderConfigCourtId]);
GO
CREATE INDEX [IX_Orders_BranchId] ON [Orders]([BranchId]);
GO
CREATE INDEX [IX_Orders_PlayerId] ON [Orders]([PlayerId]);
GO
CREATE INDEX [IX_Orders_HoldExpiresAt] ON [Orders]([HoldExpiresAt]) WHERE [Status] = 0;
GO
CREATE INDEX [IX_Branches_CourtOwnerId] ON [Branches]([CourtOwnerId]);
GO
CREATE INDEX [IX_Branches_SportTypeId] ON [Branches]([SportTypeId]);
GO
CREATE INDEX [IX_CourtOwnerSubscriptions_CourtOwnerId] ON [CourtOwnerSubscriptions]([CourtOwnerId]);
GO
CREATE INDEX [IX_CourtOwnerSubscriptions_ServicePackageId] ON [CourtOwnerSubscriptions]([ServicePackageId]);
GO
CREATE INDEX [IX_OrderServices_OrderId] ON [OrderServices]([OrderId]);
GO
CREATE INDEX [IX_OrderServices_ServiceId] ON [OrderServices]([ServiceId]);
GO
CREATE INDEX [IX_MatchParticipants_PlayerId] ON [MatchParticipants]([PlayerId]);
GO
CREATE INDEX [IX_SocialMatches_BranchId] ON [SocialMatches]([BranchId]);
GO
CREATE INDEX [IX_SocialMatches_SportTypeId] ON [SocialMatches]([SportTypeId]);
GO
CREATE INDEX [IX_SocialMatches_HostId] ON [SocialMatches]([HostId]);
GO
CREATE INDEX [IX_PaymentTransactions_OrderId] ON [PaymentTransactions]([OrderId]);
GO
CREATE INDEX [IX_RetailOrderItems_RetailOrderId] ON [RetailOrderItems]([RetailOrderId]);
GO
CREATE INDEX [IX_RetailOrderItems_ServiceId] ON [RetailOrderItems]([ServiceId]);
GO
CREATE INDEX [IX_RetailOrder_BranchId] ON [RetailOrder]([BranchId]);
GO
CREATE INDEX [IX_Services_CategoryId] ON [Services]([CategoryId]);
GO
CREATE INDEX [IX_ServiceBranches_BranchId] ON [ServiceBranches]([BranchId]);
GO
CREATE INDEX [IX_Courts_CourtTyped] ON [Courts]([CourtTyped]);
GO
CREATE INDEX [IX_CourtTypes_BranchId] ON [CourtTypes]([BranchId]);
GO
CREATE INDEX [IX_PriceTables_CourtTypeId] ON [PriceTables]([CourtTypeId]);
GO
CREATE INDEX [IX_PriceTableRules_PriceTableId] ON [PriceTableRules]([PriceTableId]);
GO
CREATE INDEX [IX_FixedTimeBlock_CourtTypeId] ON [FixedTimeBlock]([CourtTypeId]);
GO
CREATE INDEX [IX_FixedTimeBlockCourts_CourtId] ON [FixedTimeBlockCourts]([CourtId]);
GO
CREATE INDEX [IX_EventTickets_EventId] ON [EventTickets]([EventId]);
GO
CREATE INDEX [IX_EventTickets_PlayerId] ON [EventTickets]([PlayerId]);
GO
CREATE INDEX [IX_Events_SportTypeId] ON [Events]([SportTypeId]);
GO
CREATE INDEX [IX_FixedOrderConfigCourts_FixedOrderConfigId_CourtId] ON [FixedOrderConfigCourts]([FixedOrderConfigId], [CourtId]);
GO
CREATE INDEX [IX_BranchImages_BranchId] ON [BranchImages]([BranchId]);
GO
CREATE INDEX [IX_RefreshTokens_UserId] ON [RefreshTokens]([UserId]);
GO
CREATE INDEX [IX_UserRoles_RoleId] ON [UserRoles]([RoleId]);
GO