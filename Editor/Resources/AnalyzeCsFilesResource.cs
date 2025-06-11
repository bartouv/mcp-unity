using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using Newtonsoft.Json.Linq;
using UnityEditor;

namespace McpUnity.Resources
{
    /// <summary>
    /// Resource for analyzing .cs files in the Unity project
    /// </summary>
    public class AnalyzeCsFilesResource : McpResourceBase
    {
        public AnalyzeCsFilesResource()
        {
            Name = "analyze_cs_files";
            Description = "Analyzes .cs files in the Unity project and extracts class, method, and property information.";
            Uri = "unity://analyze-cs-files";
        }

        /// <summary>
        /// Fetch information about .cs files in the project
        /// </summary>
        /// <param name="parameters">Optional parameters for filtering</param>
        /// <returns>JObject containing analysis results</returns>
        public override JObject Fetch(JObject parameters)
        {
            // Get all .cs files in the project
            string[] csFiles = Directory.GetFiles(Application.dataPath, "*.cs", SearchOption.AllDirectories);

            JArray fileAnalysisResults = new JArray();

            foreach (string filePath in csFiles)
            {
                try
                {
                    string fileContent = File.ReadAllText(filePath);
                    JObject fileAnalysis = AnalyzeCsFile(filePath, fileContent);
                    fileAnalysisResults.Add(fileAnalysis);
                }
                catch (Exception ex)
                {
                    fileAnalysisResults.Add(new JObject
                    {
                        ["filePath"] = filePath,
                        ["error"] = ex.Message
                    });
                }
            }

            return new JObject
            {
                ["success"] = true,
                ["message"] = $"Analyzed {fileAnalysisResults.Count} .cs files",
                ["files"] = fileAnalysisResults
            };
        }

        /// <summary>
        /// Analyze a single .cs file
        /// </summary>
        /// <param name="filePath">Path to the .cs file</param>
        /// <param name="fileContent">Content of the .cs file</param>
        /// <returns>JObject containing analysis results</returns>
        private JObject AnalyzeCsFile(string filePath, string fileContent)
        {
            JObject analysisResult = new JObject
            {
                ["filePath"] = filePath,
                ["classes"] = new JArray(),
                ["methods"] = new JArray(),
                ["properties"] = new JArray()
            };

            // Simple parsing logic (can be extended with Roslyn or other libraries for deeper analysis)
            string[] lines = fileContent.Split(new[] { '\n', '\r' }, StringSplitOptions.RemoveEmptyEntries);

            foreach (string line in lines)
            {
                string trimmedLine = line.Trim();

                if (trimmedLine.StartsWith("class "))
                {
                    analysisResult["classes"].Add(trimmedLine);
                }
                else if (trimmedLine.Contains("void ") || trimmedLine.Contains("public ") || trimmedLine.Contains("private "))
                {
                    if (trimmedLine.Contains("(")) // Likely a method
                    {
                        analysisResult["methods"].Add(trimmedLine);
                    }
                    else if (trimmedLine.Contains("{ get; set; }")) // Likely a property
                    {
                        analysisResult["properties"].Add(trimmedLine);
                    }
                }
            }

            return analysisResult;
        }
    }
}
