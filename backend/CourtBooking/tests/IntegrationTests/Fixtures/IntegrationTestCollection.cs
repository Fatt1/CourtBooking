namespace IntegrationTests.Fixtures;

[CollectionDefinition(nameof(IntegrationTestCollection))]
public sealed class IntegrationTestCollection : ICollectionFixture<ApiFixture>;
