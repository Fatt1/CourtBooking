using System.Net;
using Amazon.S3;
using Amazon.S3.Model;
using Amazon.S3.Util;
using CourtBooking.Application.Abstractions.Storage;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;

namespace CourtBooking.Infrastructure.Storage;

public sealed class S3StorageService : IStorageService
{
    private readonly IAmazonS3 _s3Client;
    private readonly StorageOptions _options;
    private readonly ILogger<S3StorageService> _logger;

    public S3StorageService(
        IAmazonS3 s3Client,
        IOptions<StorageOptions> options,
        ILogger<S3StorageService> logger)
    {
        _s3Client = s3Client;
        _options = options.Value;
        _logger = logger;
    }

    public async Task<string> UploadAsync(
        Stream content,
        string fileName,
        string contentType,
        string? bucketName = null,
        CancellationToken cancellationToken = default)
    {
        var targetBucket = ResolveBucket(bucketName);
        await EnsureBucketExistsAsync(targetBucket, cancellationToken);

        if (content.CanSeek)
        {
            content.Position = 0;
        }

        var putRequest = new PutObjectRequest
        {
            BucketName = targetBucket,
            Key = fileName,
            InputStream = content,
            ContentType = contentType
        };

        _logger.LogInformation("Uploading file {FileName} to storage bucket {Bucket}", fileName, targetBucket);
        await _s3Client.PutObjectAsync(putRequest, cancellationToken);

        return fileName;
    }

    public async Task<Stream> DownloadAsync(
        string fileName,
        string? bucketName = null,
        CancellationToken cancellationToken = default)
    {
        var targetBucket = ResolveBucket(bucketName);

        var getRequest = new GetObjectRequest
        {
            BucketName = targetBucket,
            Key = fileName
        };

        _logger.LogInformation("Downloading file {FileName} from storage bucket {Bucket}", fileName, targetBucket);
        using var response = await _s3Client.GetObjectAsync(getRequest, cancellationToken);

        var memoryStream = new MemoryStream();
        await response.ResponseStream.CopyToAsync(memoryStream, cancellationToken);
        memoryStream.Position = 0;

        return memoryStream;
    }

    public async Task DeleteAsync(
        string fileName,
        string? bucketName = null,
        CancellationToken cancellationToken = default)
    {
        var targetBucket = ResolveBucket(bucketName);

        var deleteRequest = new DeleteObjectRequest
        {
            BucketName = targetBucket,
            Key = fileName
        };

        _logger.LogInformation("Deleting file {FileName} from storage bucket {Bucket}", fileName, targetBucket);
        await _s3Client.DeleteObjectAsync(deleteRequest, cancellationToken);
    }

    public async Task<bool> ExistsAsync(
        string fileName,
        string? bucketName = null,
        CancellationToken cancellationToken = default)
    {
        var targetBucket = ResolveBucket(bucketName);

        try
        {
            var metaRequest = new GetObjectMetadataRequest
            {
                BucketName = targetBucket,
                Key = fileName
            };

            var response = await _s3Client.GetObjectMetadataAsync(metaRequest, cancellationToken);
            return response.HttpStatusCode == HttpStatusCode.OK;
        }
        catch (AmazonS3Exception ex) when (ex.StatusCode == HttpStatusCode.NotFound)
        {
            return false;
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "Error checking existence of file {FileName} in bucket {Bucket}", fileName, targetBucket);
            return false;
        }
    }

    public async Task<string> GetPresignedUrlAsync(
        string fileName,
        int expiryInSeconds = 3600,
        string? bucketName = null,
        CancellationToken cancellationToken = default)
    {
        var targetBucket = ResolveBucket(bucketName);

        var isHttps = !string.IsNullOrWhiteSpace(_options.ServiceUrl) &&
                      _options.ServiceUrl.StartsWith("https://", StringComparison.OrdinalIgnoreCase);

        var urlRequest = new GetPreSignedUrlRequest
        {
            BucketName = targetBucket,
            Key = fileName,
            Expires = DateTime.UtcNow.AddSeconds(expiryInSeconds),
            Verb = HttpVerb.GET,
            Protocol = isHttps ? Protocol.HTTPS : Protocol.HTTP
        };

        var url = await _s3Client.GetPreSignedURLAsync(urlRequest);

        if (!isHttps && url.StartsWith("https://", StringComparison.OrdinalIgnoreCase))
        {
            url = "http://" + url["https://".Length..];
        }

        return url;
    }


    public async Task EnsureBucketExistsAsync(
        string? bucketName = null,
        CancellationToken cancellationToken = default)
    {
        var targetBucket = ResolveBucket(bucketName);

        bool exists = await AmazonS3Util.DoesS3BucketExistV2Async(_s3Client, targetBucket);
        if (!exists)
        {
            _logger.LogInformation("Creating storage bucket {Bucket}", targetBucket);
            var putBucketRequest = new PutBucketRequest
            {
                BucketName = targetBucket
            };

            await _s3Client.PutBucketAsync(putBucketRequest, cancellationToken);
        }
    }

    private string ResolveBucket(string? bucketName) =>
        string.IsNullOrWhiteSpace(bucketName) ? _options.BucketName : bucketName;
}
