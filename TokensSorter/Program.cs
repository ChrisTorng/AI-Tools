using System;
using System.IO;
using System.Linq;
using System.Text;
using System.Text.RegularExpressions;

class Program
{
    static void Main(string[] args)
    {
        if (args.Length != 2)
        {
            Console.WriteLine("使用方法: dotnet run <輸入文件名> <輸出文件名>");
            return;
        }

        string inputFile = args[0];
        string outputFile = args[1];

        if (!File.Exists(inputFile))
        {
            Console.WriteLine($"錯誤: 輸入文件 '{inputFile}' 不存在。");
            return;
        }

        try
        {
            // 讀取文件，處理每一行，並將結果存儲在一個排序的集合中
            var sortedLines = File.ReadLines(inputFile)
                .Select(DecodeString) // 解碼字串
                .Select(line => line.Trim('\'')) // 移除前後的單引號
                .OrderBy(line => line, StringComparer.Ordinal); // 排序

            // 將排序後的結果寫入新文件
            File.WriteAllLines(outputFile, sortedLines);

            Console.WriteLine($"處理完成。結果已保存到 {outputFile}");
        }
        catch (Exception ex)
        {
            Console.WriteLine($"發生錯誤: {ex.Message}");
        }
    }

    static string DecodeString(string input)
    {
        // 如果輸入是像 b'\xe0\xb2' 這樣的格式
        if (input.StartsWith("b'") && input.EndsWith("'"))
        {
            // 移除 b' 和 '
            input = input.Substring(2, input.Length - 3);

            // 使用正則表達式匹配 \xXX 格式的十六進制值
            var bytes = Regex.Matches(input, @"\\x([0-9A-Fa-f]{2})")
                .Cast<Match>()
                .Select(m => Convert.ToByte(m.Groups[1].Value, 16))
                .ToArray();

            // 將字節數組轉換為字符串
            return Encoding.UTF8.GetString(bytes);
        }

        // 如果不是特殊格式，直接返回原字符串
        return input;
    }
}