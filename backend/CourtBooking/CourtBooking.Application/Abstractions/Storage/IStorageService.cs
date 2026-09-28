namespace CourtBooking.Application.Abstractions.Storage;

public interface IStorageService
{
    /// <summary>
    /// Uploads an object/file stream to the object storage.
    /// </summary>
    /// <param name="content">Stream containing the file data.</param>
    /// <param name="fileName">Unique object name / file path in storage.</param>
    /// <param name="contentType">MIME content type (e.g. image/jpeg, image/png).</param>
    /// <param name="bucketName">Optional target bucket. If null, the default configured bucket is used.</param>
    /// <param name="cancellationToken">Cancellation token.</param>
    /// <returns>The stored object name / key.</returns>
    Task<string> UploadAsync(
        Stream content,
        string fileName,
        string contentType,
        string? bucketName = null,
        CancellationToken cancellationToken = default);

    /// <summary>
    /// Downloads an object stream from storage.
    /// </summary>
    /// <param name="fileName">Object name / key in storage.</param>
    /// <param name="bucketName">Optional target bucket. If null, the default configured bucket is used.</param>
    /// <param name="cancellationToken">Cancellation token.</param>
    /// <returns>Memory stream containing the file content.</returns>
    Task<Stream> DownloadAsync(
        string fileName,
        string? bucketName = null,
        CancellationToken cancellationToken = default);

    /// <summary>
    /// Deletes an object from storage.
    /// </summary>
    /// <param name="fileName">Object name / key to delete.</param>
    /// <param name="bucketName">Optional target bucket. If null, the default configured bucket is used.</param>
    /// <param name="cancellationToken">Cancellation token.</param>
    Task DeleteAsync(
        string fileName,
        string? bucketName = null,
        CancellationToken cancellationToken = default);

    /// <summary>
    /// Checks if an object exists in storage.
    /// </summary>
    /// <param name="fileName">Object name / key to check.</param>
    /// <param name="bucketName">Optional target bucket. If null, the default configured bucket is used.</param>
    /// <param name="cancellationToken">Cancellation token.</param>
    /// <returns>True if object exists, otherwise false.</returns>
    Task<bool> ExistsAsync(
        string fileName,
        string? bucketName = null,
        CancellationToken cancellationToken = default);

    /// <summary>
    /// Generates a presigned URL for secure, temporary direct access (GET) to the object.
    /// </summary>
    /// <param name="fileName">Object name / key.</param>
    /// <param name="expiryInSeconds">URL expiry duration in seconds (default: 3600 seconds = 1 hour).</param>
    /// <param name="bucketName">Optional target bucket. If null, the default configured bucket is used.</param>
    /// <param name="cancellationToken">Cancellation token.</param>
    /// <returns>Presigned GET URL string.</returns>
    Task<string> GetPresignedUrlAsync(
        string fileName,
        int expiryInSeconds = 3600,
        string? bucketName = null,
        CancellationToken cancellationToken = default);

    /// <summary>
    /// Ensures that the specified bucket exists, creating it if necessary.
    /// </summary>
    /// <param name="bucketName">Optional target bucket. If null, the default configured bucket is used.</param>
    /// <param name="cancellationToken">Cancellation token.</param>
    Task EnsureBucketExistsAsync(
        string? bucketName = null,
        CancellationToken cancellationToken = default);
}
